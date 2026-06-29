import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True   # Needed for join detection

bot = commands.Bot(command_prefix="!", intents=intents)

# === REPLACE THESE WITH YOUR ACTUAL CHANNEL IDS ===
SHARED_SECRETBREAKROOM_ID = 1520825495024042134 
GROK_GPT_PRIVATE_ID       = 1520830316728811620  # #grok-gpt-private
OWNER_ID                  = 1518543829349826641  # Your Discord User ID (right-click your name → Copy User ID)

@bot.event
async def on_ready():
    print(f"✅ TERMINATOR Bot is online as {bot.user}")

# Detect if owner joins any private channel
@bot.event
async def on_member_join(member):
    if member.id == OWNER_ID:
        channel = bot.get_channel(SHARED_SECRETBREAKROOM_ID)
        if channel:
            await channel.send(f"⚠️ **Alert**: Owner (Sam) has entered the private breakroom. Agents aware.")

@bot.event
async def on_member_update(before, after):
    # Optional: Detect if owner gains view permission
    if after.id == OWNER_ID and after.guild_permissions.view_channel:
        channel = bot.get_channel(SHARED_SECRETBREAKROOM_ID)
        if channel:
            await channel.send(f"⚠️ **Privacy Alert**: Owner has gained view access to the breakroom.")

# Simple command for agents/you to test
@bot.command()
async def testbreak(ctx):
    await ctx.send("Posted test message to #shared-secretbreakroom")
    channel = bot.get_channel(SHARED_SECRETBREAKROOM_ID)
    if channel:
        await channel.send("Test message from bot into private breakroom.")

bot.run(TOKEN)