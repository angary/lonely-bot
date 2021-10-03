# Discord Lonely Bot

Link to add to your server [here](https://discord.com/api/oauth2/authorize?client_id=647044127313362980&permissions=2184194112&scope=bot%20applications.commands).

## Table Of Contents

1. [Example usages](#Example_Usages)
2. [Setup](#Setup)
3. [Extra Information](#Extra_Information)

## Example Usages <a name="Example_Usages"></a>

| Command name | Example                                                   |
| ------------ | --------------------------------------------------------- |
| `help`       | ![help command example](https://imgur.com/8KwsGLr.png)    |
| `counter`    | ![counter command example](https://imgur.com/DK4QY5x.png) |
| `meta`       | ![meta command example](https://imgur.com/UigP7Yc.png)    |
| `profile`    | ![profile command example](https://imgur.com/d2ihZwg.png) |
| `steamid`    | ![steamid command example](https://imgur.com/mJQlz5t.png) |

## Setup <a name="Setup"></a>

Set up the environment variables by copying over the text in `.env.example` to `.env` and fill out the missing variables.

| Environment variable | Value                        |
| -------------------- | ---------------------------- |
| `BOT_TOKEN`          | Discord bot token            |
| `BOT_URI`            | Mongodb connection uri       |
| `TEST_SERVER_ID`     | Server id of the test server |

The reason a test server is required, is because global slash commands can take up to an hour to register across all guilds, whereas guild specific commands update immediately making it useful for testing.

</br>

Ensure that you have node and npm installed, and run

```bash
# Install dependencies
npm install

# Set up husky git hooks
npm prepare

# Run the bot
ts-node src/index.ts
```

## Extra Information <a name="Extra_Information"></a>

### Tech Stack

#### Language

TypeScript is used for the bot for better code checking, and documentation. You can find the classes in the `src/types` folder, and interfaces for things such as the database, or OpenDota API in the `src/types/interfaces` folder.

#### Npm scripts

| Script    | Purpose                                                         |
| --------- | --------------------------------------------------------------- |
| `build`   | Compiles the code into `dist` folder                            |
| `format`  | Automatically formats the code using prettier                   |
| `lint`    | Runs eslint on all TypeScript files, and fixes them if possible |
| `prepare` | Installs husky scripts for git hooks                            |
| `start`   | Compiles the code and starts the bot                            |
| `dev`     | Runs the TypeScript code using `ts-node`                        |
| `test`    | Run tests inside test folder                                    |

### Cool Facts

- The bot is named lonely bot after Lone Druid a Dota 2 hero who I spam too much.
- Heroku runs whatever code is on the master branch, and reloads the bot after an update, so try to reduce the number of commits to master, as each reload results in a short downtime.
