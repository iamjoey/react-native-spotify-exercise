import React, { useState, useContext, useCallback } from 'react';
import { View, Button, Text, Switch } from 'native-base';
import styles from '../styles';
import AppContext from '../AppContext';

const Authenticate: React.SFC = () => {
    const { isConnected, token, onError, remote, authenticate } = useContext(AppContext)
    const [autoConnect, setAutoConnect] = useState(true);

    const handleConnect = useCallback((playURI?:string) => {
        authenticate({
            playURI
        });
    }, [token])
    return (
        <View style={styles.content}>
            <View style={{ height: 300, display: "flex", justifyContent: "space-evenly", flexDirection: "column" }}>
                <View>
                    <Text style={{fontSize:28, textAlign:"center"}}>Connect To Spotify</Text>
                </View>
                <Button onPress={() => handleConnect()}>
                    <Text>Connect!</Text>
                </Button>
            </View>
        </View>
    )
}

export default Authenticate;