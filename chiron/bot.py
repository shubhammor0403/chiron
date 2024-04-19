
# Step 2: Import the required modules
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
from datetime import date
import requests

import aiohttp

# Step 3: Define your bot token
BOT_TOKEN = '6547255032:AAEqtL8NwuCBJeBAxvxHZ7VXMcR8pLu6mko'

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a message when the command /start is issued."""
    await update.message.reply_text('Hello! Send me a message and I will call the API for you.')

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles incoming messages and calls the API."""
    text = update.message.text  # Get the message text

    # Step 5: Call the API function with the received message text
    response = await call_api(text)

    # Step 6: Send the API response back to the Telegram chat
    await update.message.reply_text(response)

async def call_api(text):
    """Calls the API and returns the response."""
    today = date.today()
        # Replace this with your actual API endpoint and parameters
    api_url = 'https://shubhammor.pythonanywhere.com/api/fetch-calories/'
    response = requests.post(api_url, data={'input-text': text, 'input-date': today.strftime("%Y-%m-%d")})
    return response.json()['output']

# Step 7: Set up the bot and add handlers
app = ApplicationBuilder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

# Step 8: Start the bot
print('Bot is running...')
app.run_polling()