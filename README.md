# Discord Vanity Checker

Javascript Vanity Checker with proxy support and clear instructions

## Built with

- Node.js ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
- axios - HTTP requests ![axios](https://img.shields.io/badge/axios-5A29E4?style=flat&logo=axios&logoColor=white)
- https-proxy-agent - proxy support ![proxy](https://img.shields.io/badge/proxy-🔒-blue?style=flat)

## Features

- Batch checking from file
- Proxy rotation support
- Auto rate limiting
- Saves results to file
- Clean console output

## How it works

The tool hits Discord's invite API for each vanity URL. If it returns 404, the vanity is available. If it returns the invite data, it's taken. Results get logged to console and available ones are saved to `data/available.txt` for later.

Proxies rotate automatically if you provide them, and there's a 1 second delay between checks to avoid getting rate limited.

## Setup

```bash
npm install
```

Create `config/.env`:
```env
DISCORD_TOKEN=your_token_here
```

## How to use

Add vanities to check in `data/vanity.txt` (one per line already gave a list but can be expanded):
```
there
was
not
```

Optionally add proxies to `config/PROXY_LIST.txt`:
```
65.111.2.147:3129
98.76.54.32:3128
```

Run it:
```bash
npm start
```

## Output

Results show up in console:
- `[TAKEN]` - already claimed
- `[AVAILABLE]` - up for grabs
- `[ERROR]` - something went wrong

Available ones get saved to `data/available.txt`

## Config

Edit these in `src/index.js` if needed:
- `REQUEST_DELAY` - time between checks (default: 1000ms)
- `INVITE_API_URL` - discord api endpoint

## Notes

- You need a valid Discord token (use a discord acc u dont care abt)
- Use proxies for big lists to avoid rate limits

## Structure

```
vanity-checker/
├── config/
│   ├── .env            - your discord token
│   └── PROXY_LIST.txt  - proxies (optional)
├── data/
│   ├── vanity.txt      - vanities to check
│   └── available.txt   - results
├── src/
│   └── index.js        - main code
├── .gitignore
├── package.json
└── README.md
```

## License

ISC
