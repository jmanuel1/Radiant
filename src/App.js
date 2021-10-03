'use strict';

import React, { Component } from 'react';
import WeatherView from './components/WeatherView';
import { Constants } from 'react-native-unimodules';
console.log(Constants.systemFonts);

class ReactNativeWeather extends Component {
  render() {
    return (
      <WeatherView />
    );
  }
}

export default ReactNativeWeather;
