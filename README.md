# RU WhatsApp

Send automated WhatsApp messages containing UFPR's University Restaurant (RU) menu using AWS Lambda and Baileys.

## Overview

This project is part of the [RU Menu](https://github.com/guimox/ru-menu) ecosystem, which includes:

- [RU Scraper](https://github.com/guimox/ru-scraper) - Menu data scraper
- RU WhatsApp (this project) - WhatsApp message sender

The bot sends daily menu updates to a WhatsApp channel, supporting both text-based menus and image menus.

## Features

- Automated WhatsApp message sending using Baileys
- MongoDB integration for session persistence
- AWS Lambda deployment
- Support for multiple RU locations
- Handles both text and image-based menus
- Includes dietary information icons (vegan, gluten-free, etc.)

## Project Structure

```
ru-whatsapp/
├── db/
│   └── mongo.js         # MongoDB connection and auth state management
├── util/
│   ├── constants.js     # Icons and day names mappings
│   ├── format.js        # Message formatting utilities
│   └── util.js         # Core formatting functions
├── index.js            # Main Lambda handler
└── infra/
    └── buildspec.yml   # AWS CodeBuild configuration
```

## Related Projects

- [RU Menu](https://github.com/guimox/ru-menu) - Main project repository
