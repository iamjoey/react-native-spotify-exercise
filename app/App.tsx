import React, { useContext } from 'react';
import { View, SafeAreaView } from 'react-native';
import { Text, Root, Tabs, Tab } from 'native-base';
import AppContext, { AppContextProvider } from './AppContext';

import styles from './styles';

import ConnectButton from './Components/ConnectButton';
import Authenticate from './Components/Authenticate';
import SpotifyContent from './Components/SpotifyContent';
import Miscelaneous from './Components/Miscelaneous';
import EnvVars from './Components/EnvVars';

const AppLayout: React.SFC = () => {
  const { token, error, clearError } = useContext(AppContext);
  return (
    <View style={styles.container} >
      {token ?
        <>
          <ConnectButton />
          <Tabs initialPage={0}>
            <Tab heading="Songs">
              <SpotifyContent />
            </Tab>
            <Tab heading="Misc">
              <Miscelaneous />
            </Tab>
          </Tabs>
        </>
        :
        <>
          <Authenticate />
        </>
      }

      {error && (
        <Text onPress={clearError} style={styles.error}>{error.code}: {error.message}</Text>
      )}
    </View>
  )
}

const App: React.SFC = () => {
  return (
    <AppContextProvider>
      <SafeAreaView style={{ width: "100%", height: "100%" }}>
        <Root>
          <AppLayout />
        </Root>
      </SafeAreaView >
    </AppContextProvider>
  );
};

export default App;

