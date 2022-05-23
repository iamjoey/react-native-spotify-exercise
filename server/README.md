## Usage

1. Install dependencies using: 
```sh
yarn   # or npm install
```
2. Create a `.env` file in the root of this directory with the following entries:
```env
SPOTIFY_CLIENT_ID="client_id_from_spotify_dashboard"
SPOTIFY_CLIENT_SECRET="client_secret_from_spotify_dashboard"
SPOTIFY_CLIENT_CALLBACK="callback_registered_in_spotify_dashboard"
ENCRYPTION_SECRET="SECRET"
ENCRYPTION_METHOD="aes-256-ctr"

3. Run server using: `yarn start`
