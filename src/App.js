'use strict';

import React, { Component } from 'react';
import WeatherView from './components/WeatherView';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';

const customFonts = {
  "Weather Icons": require('react-native-iconic-font/fonts/weathericons.ttf')
};

class ReactNativeWeather extends Component {
  state = {
    fontsLoaded: false
  };

  async _loadFontsAsync() {
    await Font.loadAsync(customFonts);
    this.setState({fontsLoaded: true});
  }

  componentDidMount() {
    this._loadFontsAsync();
  }

  render() {
    if (this.state.fontsLoaded) {
      return (
        <WeatherView />
      );
    } else {
      return <AppLoading/>;
    }
  }
}

export default ReactNativeWeather;
