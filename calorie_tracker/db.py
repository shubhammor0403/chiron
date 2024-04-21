from sqlalchemy import create_engine, Column, Integer, String, DateTime, func, extract, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pandas as pd
from datetime import datetime, timedelta
import random
import string

# Create a SQLite database engine
engine = create_engine('sqlite:///ChironDB.db')

# Create a base class for defining database models
Base = declarative_base()

# Define the table model
class ChironCalories(Base):
    __tablename__ = 'chiron_calories'

    id = Column(String, primary_key=True)
    date = Column(DateTime)
    item = Column(String)
    quantity = Column(Integer)
    serving = Column(String)
    calories = Column(Integer)
    protein = Column(Integer)
    carbs = Column(Integer)
    fat = Column(Integer)
    status = Column(String)

class ChironFoodDB(Base):
    __tablename__ = 'chiron_food_db'

    id = Column(String, primary_key=True)
    item = Column(String)
    serving = Column(String)
    calories = Column(Integer)
    protein = Column(Integer)
    carbs = Column(Integer)
    fat = Column(Integer)

# Create a session maker
Session = sessionmaker(bind=engine)


def get_db_top_dishes(time):
    if time == 'breakfast':
        start_time = datetime.strptime('6:00', '%H:%M').time().strftime('%H:%M:%S')
        end_time = datetime.strptime('11:00', '%H:%M').time().strftime('%H:%M:%S')
    if time == 'lunch':
        start_time = datetime.strptime('11:00', '%H:%M').time().strftime('%H:%M:%S')
        end_time = datetime.strptime('15:00', '%H:%M').time().strftime('%H:%M:%S')
    if time == 'snacks':
        start_time = datetime.strptime('15:00', '%H:%M').time().strftime('%H:%M:%S')
        end_time = datetime.strptime('21:00', '%H:%M').time().strftime('%H:%M:%S')
    if time == 'dinner':
        start_time = datetime.strptime('18:00', '%H:%M').time().strftime('%H:%M:%S')
        end_time = datetime.strptime('23:59', '%H:%M').time().strftime('%H:%M:%S')
    # Query and group by item name
    #write and execute a sql query
    sql_query = """
        SELECT item
        FROM chiron_calories
        WHERE TIME(date) BETWEEN :start_time AND :end_time
        GROUP BY item
        ORDER BY SUM(quantity) DESC
        LIMIT 5;
    """

    # sql_query = """
    #     SELECT item, TIME(date) AS time, quantity from chiron_calories;
    # """
    with engine.connect() as connection:
        result = connection.execute(text(sql_query), start_time=start_time, end_time=end_time)
        rows = result.fetchall()

    if rows != []:
        result = ", ".join([row[0] for row in rows])
    else:
        result = ''
    print(time, rows)
    
    return result



def query_db_existing(structured_df):
    session = Session()
    # query db for existing items
    items = session.query(ChironFoodDB).filter(
        (ChironFoodDB.item.in_(structured_df['item'])) & (ChironFoodDB.serving.in_(structured_df['serving']))
    ).all()
    session.close()
    # Process the fetched items as needed
    data = [{'id': item.id, 'item': item.item,  
                'serving': item.serving, 'calories': item.calories, 'protein': item.protein, 'carbs': item.carbs, 'fat': item.fat} for item in items]
    
    foodDBdf = pd.DataFrame(data, columns=['item', 'serving', 'calories', 'protein', 'carbs', 'fat'])
    merged_df = pd.merge(structured_df, foodDBdf, on=['item', 'serving'], how='left')
    existing_items_df = merged_df[merged_df['calories'].notna()]
    existing_items_df['calories'] = existing_items_df['calories']*existing_items_df['quantity']
    existing_items_df['id'] = existing_items_df.apply(lambda x: ''.join(random.choices(string.ascii_uppercase + string.digits, k=9)), axis=1)
    existing_items_df = existing_items_df[['id'] + [col for col in existing_items_df.columns if col != 'id']]
    input_text_df = merged_df[merged_df['calories'].isna()]
    if input_text_df.empty:
        quantities = []
        for index, row in input_text_df.iterrows():
            quantities.append(row['quantity'])
            
        return existing_items_df, "", quantities
    else:
        #print(existing_items_df, input_text_df)
        input_text_llm_raw = []
        quantities = []
        for index, row in input_text_df.iterrows():
        # Append text for the current row
            if row['serving'].lower() != 'item':
                text = f"{row['serving']}, {row['item']}"
            else:
                text = f"{row['item']}"
            quantities.append(row['quantity'])
            input_text_llm_raw.append(text)

        # Join the texts with '\n' after every row except the last one
        input_text_llm = '\n'.join(input_text_llm_raw)
        print(existing_items_df, input_text_llm, quantities)
        return existing_items_df, input_text_llm, quantities

def push_to_food_db(df_llm):
    df_llm.rename(columns={'calories_per_item': 'calories'}, inplace=True)
    df_llm['id'] = df_llm.apply(lambda x: ''.join(random.choices(string.ascii_uppercase + string.digits, k=9)), axis=1)
    df_llm = df_llm[['id'] + [col for col in df_llm.columns if col != 'id']]
    session = Session()
    session.bulk_insert_mappings(ChironFoodDB, df_llm.to_dict('records'))
    session.commit()
    session.close()

def push_to_db(data_df, date):
    session = Session()
    session.bulk_insert_mappings(ChironCalories, data_df.to_dict('records'))
    session.commit()
    session.close()
    # query sql to get with only date as arg date

    items = session.query(ChironCalories).filter(func.strftime('%Y-%m-%d', ChironCalories.date) == date.strftime('%Y-%m-%d')).all()
    session.close()
    # map query result to list of dicts
    data = [{'id': item.id, 'date': item.date, 'item': item.item, 'quantity': item.quantity, 
             'serving': item.serving, 'calories': item.calories, 'protein': item.protein, 'carbs': item.carbs, 'fat': item.fat, 'status': item.status} for item in items]
    df = pd.DataFrame(data)

    return df

def delete_db_calories(date):
    session = Session()
    session.query(ChironCalories).filter(func.strftime('%Y-%m-%d', ChironCalories.date) == date.strftime('%Y-%m-%d')).delete(synchronize_session='fetch')
    session.commit()
    session.close()

def delete_db_individual_calories(id):
    session = Session()
    session.query(ChironCalories).filter(ChironCalories.id == id).delete(synchronize_session='fetch')
    session.commit()
    session.close()

def add_db_planned_calories(id, date):
    session = Session()
    session.query(ChironCalories).filter(ChironCalories.id == id).update({"status": "completed", "date": date}, synchronize_session="fetch")  
    session.commit()
    session.close()


def fetch_from_db(date):
    session = Session()
    # query sql to get with only date as arg date
    items = session.query(ChironCalories).filter(func.strftime('%Y-%m-%d', ChironCalories.date) == date.strftime('%Y-%m-%d')).all()
    session.close()
    # map query result to list of dicts
    if(items != []):
        data = [{'id': item.id, 'date': item.date, 'item': item.item, 'quantity': item.quantity, 
                'serving': item.serving, 'calories': item.calories, 'protein': item.protein, 'carbs': item.carbs, 'fat': item.fat, 'status': item.status} for item in items]
    else:
        data = []
    return data

def fetch_todays_items():
    session = Session()
    # query sql to get with only date as arg date
    items = session.query(ChironCalories).filter(func.strftime('%Y-%m-%d', ChironCalories.date) == datetime.now().date().strftime('%Y-%m-%d')).all()
    session.close()
    # map query result to list of dicts
    if(items != []):
        data = result = ", ".join([row.item for row in items])
    else:
        data = ''
    return data

def clean_db():
    session = Session()
    session.execute("DROP TABLE chiron_food_db")
    session.commit()
    session.close()

def fetch_weekly_data():
    session = Session()

    end_date_current_week = datetime.now().date() + timedelta(days=1)
    start_date_current_week = datetime.now().date() - timedelta(days=6)
    end_date_previous_week = start_date_current_week - timedelta(days=1)
    start_date_previous_week = end_date_previous_week - timedelta(days=7)


    items = session.query(
        func.date(ChironCalories.date).label('date'),  # Extract date part of datetime field
        func.sum(ChironCalories.calories).label('calories'),
        func.sum(ChironCalories.protein).label('protein'),
        func.sum(ChironCalories.carbs).label('carbs'),
        func.sum(ChironCalories.fat).label('fat')
    ).filter(
        ChironCalories.date.between(start_date_current_week, end_date_current_week),
        ChironCalories.status == 'completed'
    ).group_by(
        func.date(ChironCalories.date)  # Group by date
    ).all()

    if items is None:
        items = []

    subquery_current_week = session.query(
            func.date(func.strftime('%Y-%m-%d', ChironCalories.date)).label('date'),
            func.sum(ChironCalories.calories).label('total_calories')
        ).filter(
            ChironCalories.date.between(start_date_current_week, end_date_current_week),
            ChironCalories.status == 'completed'
        ).group_by(
            func.date(func.strftime('%Y-%m-%d', ChironCalories.date))
        ).subquery()

    if subquery_current_week is None:
        avg_weekly_calories = 0
    else:
        avg_weekly_calories = session.query(
        func.avg(subquery_current_week.c.total_calories).label('avg_weekly_calories')
            ).select_from(subquery_current_week).scalar()
        if avg_weekly_calories is None:
            avg_weekly_calories = 0
        else:
            avg_weekly_calories = int(avg_weekly_calories)

    subquery_prev_week = session.query(
            func.date(func.strftime('%Y-%m-%d', ChironCalories.date)).label('date'),
            func.sum(ChironCalories.calories).label('total_calories')
        ).filter(
            ChironCalories.date.between(start_date_previous_week, end_date_previous_week),
            ChironCalories.status == 'completed'
        ).group_by(
            func.date(func.strftime('%Y-%m-%d', ChironCalories.date))
        ).subquery()

    if subquery_prev_week is None:
        avg_prev_weekly_calories = 0 
    else:
        avg_prev_weekly_calories = session.query(
            func.avg(subquery_prev_week.c.total_calories).label('avg_weekly_calories')
        ).select_from(subquery_prev_week).scalar()
        if avg_prev_weekly_calories is None:
            avg_prev_weekly_calories = 0
        else:
            avg_prev_weekly_calories = int(avg_prev_weekly_calories)

    session.close()

    if items:
        data = [{'last_seven_days':[datetime.strptime(item.date, '%Y-%m-%d').strftime("%d %B") for item in items], 'calories':[item.calories for item in items], 
                'protein':[item.protein for item in items], 'carbs':[item.carbs for item in items], 'fat': [item.fat for item in items]}]
        data[0]['avg_weekly_calories_current'] = avg_weekly_calories
        data[0]['avg_weekly_calories_prev'] = avg_prev_weekly_calories
    else:
        data = []
        
    return data




