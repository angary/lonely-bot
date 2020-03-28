# Importing the discord.py library
import discord

# Creates instance of a client which is the connection to discord
client = discord.Client()

# Once the bot is ready, prints out "Red panda active." in terminal/ where you run it
@client.event
async def on_ready():
    print("Red panda active.")


@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('test'):
        await message.channel.send('Hello!')

# Assigning string (which is my discord bot token) to variable client.run (i think)
client.run("NjQ3MDQ0MTI3MzEzMzYyOTgw.Xn32KQ.hhEIWWN1b3e4dZVW5H66gFxcyk0")
