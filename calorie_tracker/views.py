from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db import Session, push_to_db, fetch_from_db, fetch_weekly_data, query_db_existing, push_to_food_db, delete_db_calories, get_db_top_dishes, fetch_todays_items
from .calorie_extractor import generate_calorie_info_from_llm, create_calorie_df, generate_food_structure, create_existingcheck_df, get_recommendations, process_recommendations, get_calories_for_rec, process_calories_for_rec
from datetime import datetime
from pytz import timezone
import pandas as pd

def index(request):
    return render(request, 'calorie_tracker/index.html', {})

@api_view(['POST'])
def fetch_calories(request):
    # Get the input text from the request
    input_text = request.data.get('input-text')
    input_date = request.data.get('input-date')
    
    # parse input_date to get date then check if today, then assign input_date = current date and time
    if input_date:
        date_obj = datetime.strptime(input_date, '%Y-%m-%d').date()
        if date_obj == datetime.today().date():
            input_date = datetime.now(timezone('Asia/Kolkata'))
        else:
            input_date = datetime(date_obj.year, date_obj.month, date_obj.day)

    if(input_text!=''):
        structured_items = generate_food_structure(input_text)
        # print(input_text, structured_items)
        # print(create_existingcheck_df(structured_items))
        df, input_text_llm, quantities = query_db_existing(create_existingcheck_df(structured_items))
        # print(input_text_llm)
        if(input_text_llm!=""):
            calorie_info_from_llm = generate_calorie_info_from_llm(input_text_llm)
            # print(calorie_info_from_llm)
            df_llm = create_calorie_df(calorie_info_from_llm, quantities)
            # print(df_llm)
            push_to_food_db(df_llm[['item', 'serving', 'calories_per_item', 'protein', 'carbs', 'fat']])
            df_llm = df_llm.drop(columns=['calories_per_item'])
            # print(existing_items_df, df_llm)
            df = pd.concat([df, df_llm], axis=0)
        df.insert(2, 'date', input_date)
        df = push_to_db(df,date_obj)
    else:
        df = pd.DataFrame(fetch_from_db(date_obj))
    
    if not df.empty:
        total_calories = df['calories'].sum()
        total_pr = df['protein'].sum()
        total_cb = df['carbs'].sum()
        total_fa = df['fat'].sum()
        df['date'] = df['date'].dt.strftime('%I:%M %p').apply(lambda x: x.lstrip('0'))
        calorie_df = df.drop(columns=['id','protein','carbs','fat'])
        # modify column names of calorie_df to "Item","Quantity","Serving Size","Calories"
        calorie_df = calorie_df.rename(columns={'item':'Item', 'date':'Date', 'quantity':'Quantity', 'serving':'Serving Size', 'calories':'Calories'})
        calorie_df['Calories'] = calorie_df['Calories'].astype(str) + ' Kcal'
        # Convert the DataFrame to a JSON-friendly format
        data = calorie_df.to_dict('records')
        # Construct the response dictionary
        response = {'total_calories': total_calories, 'total_pr': total_pr, 'total_cb': total_cb, 'total_fa': total_fa, 'table_data': data, 'output':'Noted!'}
    else:
        response = {'message': 'No data found for given date'}
    return Response(response)

@api_view(['POST'])
def delete_calories(request):

    input_date = request.data.get('input-date')
    if(input_date):
        date_obj = datetime.strptime(input_date, '%Y-%m-%d').date()
        delete_db_calories(date_obj)
        response = {'message': 'Deleted'}
    else:
        return Response({'message': 'Invalid input date'}, status=400)
    return Response(response)

@api_view(['POST'])
def fetch_week_data(request):
    response = fetch_weekly_data()

    return Response(response)

@api_view(['POST'])
def fetch_suggestions(request):
    time_now = datetime.now(timezone('Asia/Kolkata'))
    dinner = get_db_top_dishes('dinner')
    if time_now.hour < 18:
        snacks = get_db_top_dishes('snacks')
    if time_now.hour < 15:
        lunch = get_db_top_dishes('lunch')
    if time_now.hour < 11:
        breakfast = get_db_top_dishes('breakfast')
    todays_items = fetch_todays_items()
    recommendations = get_recommendations(todays_items, breakfast, snacks, lunch, dinner)
    recommendations = process_recommendations(recommendations)
    output_dict = {}
    for key in recommendations:
        if (key == "Breakfast" and breakfast!=''):
            output_dict[key] = process_calories_for_rec(get_calories_for_rec(recommendations[key]))
        if (key == "Lunch" and lunch!=''):
            output_dict[key] = process_calories_for_rec(get_calories_for_rec(recommendations[key]))
        if (key == "Snacks" and snacks!=''):
            output_dict[key] = process_calories_for_rec(get_calories_for_rec(recommendations[key]))
        if (key == "Dinner" and dinner!=''):
            output_dict[key] = process_calories_for_rec(get_calories_for_rec(recommendations[key]))
    return Response(output_dict)