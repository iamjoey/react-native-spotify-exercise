const express = require('express');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');
const QueryString = require('querystring');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
var SpotifyWebApi = require('spotify-web-api-node');

// api to connect to Spotify API, based on https://github.com/cjam/react-native-spotify-remote

const spClientId = process.env.SPOTIFY_CLIENT_ID;
const spClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const spClientCallback = process.env.SPOTIFY_CLIENT_CALLBACK;
const authString = Buffer.from(spClientId+':'+spClientSecret).toString('base64');
const authHeader = `Basic ${authString}`;
const spotifyEndpoint = 'https://accounts.spotify.com/api/token';

var spotifyApi = new SpotifyWebApi({
  clientId: spClientId,
  clientSecret: spClientSecret,
  redirectUri: spClientCallback,
});

// encryption keys
const encSecret = process.env.ENCRYPTION_SECRET;
const encMethod = process.env.ENCRYPTION_METHOD || "aes-256-ctr";
const encrypt = (text) => {
	const aes = crypto.createCipher(encMethod, encSecret);
	let encrypted = aes.update(text, 'utf8', 'hex');
	encrypted += aes.final('hex');
	return encrypted;
};
const decrypt = (text) => {
	const aes = crypto.createDecipher(encMethod, encSecret);
	let decrypted = aes.update(text, 'hex', 'utf8');
	decrypted += aes.final('utf8');
	return decrypted;
};

// handle sending POST request
function postRequest(url, data={})
{
	return new Promise((resolve, reject) => {
		// build request data
		url = new URL(url);
		const reqData = {
			protocol: url.protocol,
			hostname: url.hostname,
			port: url.port,
			path: url.pathname,
			method: 'POST',
			headers: {
				'Authorization': authHeader,
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}

		// create request
		const req = https.request(reqData, (res) => {
			// build response
			let buffers = [];
			res.on('data', (chunk) => {
				buffers.push(chunk);
			});

			res.on('end', () => {
				// parse response
				let result = null;
				try
				{
					result = Buffer.concat(buffers);
					result = result.toString();
					var contentType = res.headers['content-type'];
					if(typeof contentType == 'string')
					{
						contentType = contentType.split(';')[0].trim();
					}
					if(contentType == 'application/x-www-form-urlencoded')
					{
						result = QueryString.parse(result);
					}
					else if(contentType == 'application/json')
					{
						result = JSON.parse(result);
					}
				}
				catch(error)
				{
					error.response = res;
					error.data = result;
					reject(error);
					return;
				}
				resolve({response: res, result: result});
			})
		});

		// handle error
		req.on('error', (error) => {
			reject(error);
		});

		// send
		data = QueryString.stringify(data);
		req.write(data);
		req.end();
	});
}

// support form body
app.use(express.urlencoded({extended: false}));
app.use(express.json());

/**
 * Swap endpoint
 * Uses an authentication code on body to request access and refresh tokens
 */
app.post('/swap', async (req, res) => {
	try {
		console.log("SWAP");
		// build request data
		const reqData = {
			grant_type: 'authorization_code',
			redirect_uri: spClientCallback,
			code: req.body.code
		};

		// get new token from Spotify API
		const { response, result } = await postRequest(spotifyEndpoint, reqData);

		// encrypt refresh_token
		if (result.refresh_token) {
			result.refresh_token = encrypt(result.refresh_token);
		}

		// send response
		res.status(response.statusCode).json(result);
	}
	catch(error) {
		if(error.response) {
			res.status(error.response.statusCode);
		}
		else {
			res.status(500);
		}
		if(error.data) {
			res.send(error.data);
		}
		else {
			res.send("");
		}
	}
});

/**
 * Refresh endpoint
 * Uses the refresh token on request body to get a new access token
 */
app.post('/refresh', async (req, res) => {
	console.log("REFRESH");
	try {
		// ensure refresh token parameter
		if (!req.body.refresh_token) {
			res.status(400).json({error: 'Refresh token is missing from body'});
			return;
		}

		// decrypt token
		const refreshToken = decrypt(req.body.refresh_token);
		// build request data
		const reqData = {
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		};
		// get new token from Spotify API
		const { response, result } = await postRequest(spotifyEndpoint, reqData);

		// encrypt refresh_token
		if (result.refresh_token) {
			result.refresh_token = encrypt(result.refresh_token);
		}

		// send response
		res.status(response.statusCode).json(result);
	}
	catch(error) {
		if(error.response) {
			res.status(error.response.statusCode);
		}
		else {
			res.status(500);
		}
		if(error.data) {
			res.send(error.data);
		}
		else {
			res.send("");
		}
	}
});


/**
 * Callback url
 */
app.get('/callback', async (req, res) => {
	const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.send('Success! You can now close the window.');

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
      }, expires_in / 2 * 1000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

/**
 * Callback url
 */
 app.post('/playlist', async (req, res) => {
	console.log("CREATE PLAYLIST", req.body);

	spotifyApi.setAccessToken(req.body.token)

	spotifyApi.createPlaylist('My new playlist', { 'description': 'My awesome new generated playlist', 'public': false })
	.then(function(data) {
		console.log('Created playlist!');
		
		spotifyApi.addTracksToPlaylist(data.body.id, req.body.tracks)
		.then(function(data) {
			console.log('Added tracks to playlist!');
			res.send(200);
		}, function(err) {
			console.log('Something went wrong!', err);
			res.send(err);
		});

	}, function(err) {
		console.log('Something went wrong!', err);
		res.send(err);
	});

});

app.get('/genres', async (req, res) => {
	console.log("GENRES GET", req.query)
	spotifyApi.setAccessToken(req.query.token)
	// Get available genre seeds
	spotifyApi.getAvailableGenreSeeds()
	.then(function(data) {
		let genreSeeds = data.body;
		res.send(genreSeeds);
	}, function(err) {
		console.log('Something went wrong!', err);
	});
});

app.get('/tracks', async (req, res) => {
	console.log("RECOMANDATIONS GET", req.query)
	spotifyApi.setAccessToken(req.query.token);
	let limit = Math.ceil((req.query.hours * 60) / 3.5);

	spotifyApi.getRecommendations({
		limit: limit,
		seed_genres: req.query.genre
	}).then(function(data) {
    let recommendations = data.body;
    res.send(recommendations);
	}, function(err) {
    console.log("Something went wrong!", err);
  });
});

const spServerPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(spServerPort, () => console.log('Server listening on port '+spServerPort+'!'));
