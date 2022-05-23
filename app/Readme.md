

## Install

1. `yarn install`

2. Install Pods by running: `cd ios && pod install && cd ..`

3. `yarn install && yarn build`

### ENV FILE
SPOTIFY_CLIENT_ID="client_id_from_spotify_dashboard"
SPOTIFY_REDIRECT_URL="redirect_uri_registered_in_spotify_dashboard"
SPOTIFY_TOKEN_REFRESH_URL="http://{MACHINE_IP_ADDRESS}:3000/refresh"
SPOTIFY_TOKEN_SWAP_URL="http://{MACHINE_IP_ADDRESS}:3000/swap"
