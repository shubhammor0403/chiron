import os
from openai import OpenAI
from datetime import date, datetime, timedelta
import pandas as pd
import random
import string
import os
from django.conf import settings

client = OpenAI()


def generate_food_structure(food_items):
    # prompt = f"""
    # Given the list of food item(s) and their quantities in each line, for each item, provide structured output separated by comma 
    # in the following format (ENSURE each item is separated by //):

    # Output Format:
    # quantity,food_item,serving_size//quantity,food_item,serving_size

    # Input Sample 1:
    # 1 Bowl Dal Chawal
    # 2 Bananas
    # 2 Roti

    # Output for Input sample 1:
    # 1,Dal Chawal,Bowl//2,Banana,Item//2,Roti,Item
    
    # Input Sample 2:
    # 1 Bowl (500ml) Dal Chawal

    # Output for Input sample 2:
    # 1,Dal Chawal,Bowl (500ml)

    # ...
    # Instructions:
    # - Do not start the output with 'Output:' No additional text or detail required. Stick to the Samples above.
    # - In case a line has an input with multiple items with any separator, e.g. "2 roti &/and/, 1 cup rice", split it and add multiple lines with individual items and their quantities (again separated by //).
    # - If serving size is mentioned with quantity, e.g. 1 cup dal, then add that serving size, and ensure that output for food_item should only have item and not serving, e.g. "1,Dal,Cup"
    # - Serving should be whatever is mentioned. If not mentioned, take 'Item'. Mostly should be item. E.g. for 3 Roti, serving = "Item". for 2 cup dal, serving = "Cup". for 1 bowl (500ml) Dal Chawal, serving = "Bowl (500ml)"
    # - Only add measurements in serving when user has provided it completely. E.g. Only when input is 1 bowl (500ml) dal chawal, serving should be "Bowl (500ml)", not just "Bowl". For 1 bowl dal chawal, serving should be "Bowl"
    # - No matter input capitalization, give output in sentence case for all
    # - Ensure quantities are correctly noted down even if just one item is given. In case no quantity is given before or after the item, assume quantity = 1. Mostly quantities will be given in beginning E.g. "3 Bananas" where 3 is the quantity.

    # Food items:
    # {food_items}
    # """


    prompt = f"""Human: Given a list of food items and their quantities, provide the following structured output for each item, separated by //: 

        quantity,food_item,serving_size//quantity,food_item,serving_size

        Instructions:
        - No additional text or details required in the beginning or end, follow the format strictly separating details by commas and items by //
        - If serving size is mentioned with quantity (e.g., 1 cup dal), use that serving size. Otherwise, use 'Piece' as serving size.
        - Only include measurements in serving size when provided completely (e.g., 'Bowl (500ml)', not just 'Bowl').
        - Use sentence case for all outputs.
        - If no quantity is given, assume quantity = 1.
        - Quantities will mostly be given at the beginning (e.g., "3 Bananas" where 3 is the quantity).
        - In case multiple items are given separated by 'and'/'with', separate them into individual items with different quantities in the output.
        
        Food items:
        {food_items}
    """
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        n=1,
        stop=None,
        temperature=0,
    )

    return response.choices[0].message.content.strip()

def generate_calorie_info_from_llm(food_items):
    # prompt = f"""
    # Given the list of food items and their quantities, provide the calories (in kcal), protein, carbs and fat (in g) information for each food_item in a single line in the following format (ENSURE each item is separated by //):

    # Format:
    # quantity,serving_size,food_item,calories,protein,carbs,fat//quantity,serving_size,food_item,calories,protein,carbs,fat

    # Input Sample:
    # 1 Bowl (500ml) Dal Chawal
    # 2 Bananas
    # 2 Bowl Dal

    # Output sample:
    # 1,Bowl (500ml),Dal Chawal,300,17,12,2//2,Item,Banana,105,7,4,1//2,Bowl,Dal,100,5,4,1

    # Note: These are random sample values. I want you to derive the calories per item for these items step by step like a nutritionist.
    
    # ...
    # Instructions:
    # - Follow output format strictly, no extra words. Output should be string for processing furthe (just details separated by , and items separated by //).
    # - Target audience is Indian, so provide calories in Indian context.
    # - Ensure value of calories, protein, carbs and fats is for 1 quantity/serving of given item, not quantity multipled by value. Do not add Kcal or g or any unit after variables. 
    # - In case a line has an input with multiple items with any separator, e.g. "2 roti &/and/, 1 cup rice", split it and add multiple lines with individual items and their quantities.
    # - If serving size is mentioned with quantity, e.g. 1 cup dal, then use that serving size to calculate calories, and ensure that output for item should only have item and not serving, e.g. "1,Cup,Dal,calorie_value.."
    # - Serving should be whatever is mentioned. If not mentioned, take 'Item'. Mostly should be item. E.g. for 3 Roti, serving = "Item". for 2 cup dal, serving = "Cup". for 1 bowl (500ml) Dal Chawal, serving = "Bowl (500ml)"
    # - Only add measurements in serving when user has provided it completely. E.g. Only when input is 1 bowl (500ml) dal chawal, serving should be "Bowl (500ml)", not just "Bowl". For 1 bowl dal chawal, serving should be "Bowl"
    # - No matter input capitalization, give output in sentence case for all
    # - Ensure quantities are correctly noted down even if just one item is given. In case no quantity is given before or after the item, assume quantity = 1. Mostly quantities will be given in beginning E.g. "3 Bananas" where 3 is the quantity.

    # Food items:
    # {food_items}

    
    # """

    prompt = f"""Human: Given a list of food items in the format [food_item] or [serving size, food_item], provide the calories, protein, carbs, and fat information for each item in the following format:

        serving_size,food_item,calories,protein,carbs,fat//serving_size,food_item,calories,protein,carbs,fat

        Instructions:
        - No additional text or details required in the beginning or end. Follow the output format strictly, separating details by commas and items by //.
        - Provide calories in Indian context.
        - Calories, protein, carbs, and fat should be for 1 quantity/serving of the item, without units.
        - If serving size is mentioned, use that serving size to calculate calories. Otherwise, use 'Piece' as serving size.
        - Only include measurements in serving size when provided completely (e.g., 'Bowl (500ml)', not just 'Bowl').
        - Use sentence case for all outputs.
        - If no quantity is given, assume quantity = 1.
        
        Food items:
        {food_items}
    """
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        n=1,
        stop=None,
        temperature=0,
    )

    return response.choices[0].message.content.strip()

def create_existingcheck_df(calorie_info):
    data = []
    for line in calorie_info.split('//'):
        parts = line.split(',')
        if len(parts) == 3:
            item = parts[1]
            quantity = int(parts[0])
            serving = parts[2]
            data.append({'item': item, 'quantity': quantity, 'serving': serving})
    
    return pd.DataFrame(data)

def create_calorie_df(calorie_info, quantities):
    data = []
    for line, quantity in zip(calorie_info.split('//'), quantities):
        id = ''.join(random.choices(string.ascii_letters + string.digits, k=9))
        parts = line.split(',')
        if len(parts) == 6:
            item = parts[1]
            serving = parts[0]
            calories_per_item = int(float(parts[2]))
            protein = int(float(parts[3]))
            carbs = int(float(parts[4]))
            fats = float(parts[5])
            total_calories = quantity * calories_per_item
            total_pr = quantity * protein
            total_cb = quantity * carbs
            total_fa = int(quantity * fats)
            data.append({'id': id, 'item': item, 'quantity': quantity, 'serving': serving, 'calories_per_item': calories_per_item,'calories': total_calories,  
                        'protein': total_pr, 'carbs': total_cb, 'fat': total_fa})

    return pd.DataFrame(data)
