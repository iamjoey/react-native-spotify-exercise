import React, { useState, useCallback, useEffect, useContext, useReducer } from "react";
import { ContentItem, remote } from "react-native-spotify-remote";
import { ActionSheet, View, Button, Text} from "native-base";
import { FlatList, StyleSheet, TextInput } from "react-native";
import SpotifyContentListItem from "./SpotifyContentListItem";
import DropDownPicker from 'react-native-dropdown-picker';
import AppContext from "../AppContext";
import { API_BASE } from 'react-native-dotenv';
import defaultStyle from '../styles';

// TODO: clean this up
const Item = ({ title }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const Playlist = ({ tracks }) => (
  <View style={styles.playlist}>
    <Text>
      Playlist created with {tracks.length} tracks:
    </Text>
    <FlatList
      data={tracks}
      renderItem={({ item }) => <Item
        title={item.name}
      />}
    />
  </View>
);

const SpotifyContent: React.SFC = () => {
  const { isConnected, onError, token } = useContext(AppContext)
  const [parentItems, setParentItems] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<Object[]>([]);
  const [genre, setGenre] = useState<Object[]>([]);
  const [hours, onChangeHours] = useState('How many hours of music do you want?');
  const [tracks, setTracks] = useState<Object[]>([]);

  // The current parent is the last parent if there are any
  const currentItem = parentItems[parentItems.length - 1];

  const back = useCallback(() => {
    if (parentItems.length === 1) {
      return;
    } else {
      const newParents = [...parentItems];
      newParents.pop();
      setParentItems(newParents);
    }
  }, [parentItems]);

  const pushParent = useCallback(async (nextParent: ContentItem) => {
    try {
      if (nextParent.container && nextParent.children == undefined || nextParent.children.length === 0) {
        const loadedChildren = await remote.getChildrenOfItem(nextParent);
        const newParent = {
          ...nextParent,
          children: loadedChildren
        }
        setParentItems([...parentItems, newParent]);
      } else {
        setParentItems([...parentItems, nextParent]);
      }
    } catch (err) {
      onError(err);
    }
  }, [parentItems])

  const fetchItems = async () => {
    try {
      let retrieved: ContentItem[] = [];
      retrieved = await remote.getRecommendedContentItems({ type: "default", flatten: false });
  
      const rootItem: ContentItem = {
        title: "",
        availableOffline: false,
        container: true,
        id: "",
        playable: false,
        subtitle: "",
        uri: "",
        children: retrieved
      }
      setParentItems([rootItem]);
    } catch (err) {
      onError(err);
    }
  };

  const fetchGenres = async () => {
    try {
      console.log('try request with access token: ', token);
      fetch(API_BASE + '/genres?' + 'token=' + token, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }
      }).then((resp) => resp.json())
      .then((data) => {
        let genresLabeled : object[] = [];
        data.genres.forEach((item: any) => {
          genresLabeled.push({ 
            label: item,
            value: item
          });
        });
        //console.log("genres", genresLabeled);
        setGenres(genresLabeled);
      });

    } catch (err) {
      onError(err);
    }
  };

  const createPlaylist = async() => {
    try {
      let genresString = '';
      genre.forEach(item => {
        genresString += '&genre=' + item
      });
      let results = fetch(API_BASE + '/tracks' + '?hours=' + hours + genresString + '&token=' + token, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }
      }).then((resp) => resp.json())
      .then((data) => {
        setTracks(data.tracks);
      });

      results.then((data) => {
        console.log("lets go! create playlist");
        fetch(API_BASE + '/playlist', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            tracks: tracks.map(track => track.uri)
          })
        }).then((resp) => resp.json())
        .then((data) => {
          // todo: create alert
          console.log("playlist created!");
        });
      })

    } catch (err) {
      onError(err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchItems();
      fetchGenres();
    }
  }, [isConnected]);

  return (
    <View>
      <View style={defaultStyle.content} >
        
        <DropDownPicker
            items={genres}
            style={{backgroundColor: '#fafafa'}}
            dropDownStyle={{backgroundColor: '#fafafa'}}
            onChangeItem={item => setGenre(item)}
            multiple={true}
            multipleText="%d genres have been selected."
            min={0}
            max={5}
            containerStyle={{height: 50}}
            itemStyle={{
                justifyContent: 'flex-start',
                paddingVertical: 10,
                borderBottomColor: '#ebebeb',
                borderBottomWidth: 1
            }}
            dropDownStyle={{height: 400}}
        />
  
        <TextInput
          onChangeText={text => onChangeHours(text)}
          placeholder="How many hours of music do you want?"
          keyboardType="numeric"
          style={styles.input}
        />
        
          <Button onPress={() => createPlaylist()}>
            <Text>Create playlist</Text>
          </Button>
        
      
        {tracks.length > 0 &&
          <Playlist tracks={tracks} />
        }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#ebebeb',
    padding: 20,
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
  },
  playlist: {
    marginVertical: 20
  },
  input: {
    marginVertical: 10,
    borderColor: '#ebebeb',
    borderWidth: 1,
    paddingHorizontal: 15
  }
});

export default SpotifyContent;