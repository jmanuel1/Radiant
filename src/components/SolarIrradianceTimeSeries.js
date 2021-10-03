'use strict';

import React, { useState, useEffect } from 'react';
import Loading from './Loading';
import moment from 'moment';
import {
  ActivityIndicator,
  Text,
  View,
  Image,
  ImageBackground,
} from 'react-native';
import styles from './ForecastView-styles.js';

export default function ({location}) {
  const [series, loading] = useIrradianceData(location);
  if (loading) {
    return <Loading/>;
  }
  console.log(series);
  return <Text style={styles.whiteText}>{JSON.stringify(series)}</Text>;
}

function useIrradianceData(location) {
  const today = moment();
  const aYearAgo = today.clone().subtract(1, 'year');
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState(null);
  useEffect(() => {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${location.coords.longitude}&latitude=${location.coords.latitude}&start=${aYearAgo.format('YYYYMMDD')}&end=${today.format('YYYYMMDD')}&format=JSON`;
    fetch(url).then(r => r.json()).then(data => {
      setSeries(computeWeeklyAverage(data.properties.parameter.ALLSKY_SFC_SW_DWN));
      setLoading(false);
    });
  }, [location.coords.longitude, location.coords.latitude]);
  return [series, loading];
}

function computeWeeklyAverage(dailyPoints) {
  const totalsByWeek = new Map();
  const countByWeek = new Map();
  for (let date in dailyPoints) {
    if (dailyPoints[date] < 0) {
      continue;
    }
    const week = moment(date, 'YYYYMMDD').format('YYYY-ww');
    console.log(date, week);
    if (!totalsByWeek.has(week)) {
      totalsByWeek.set(week, 0);
      countByWeek.set(week, 0);
    }
    totalsByWeek.set(week, totalsByWeek.get(week) + dailyPoints[date]);
    countByWeek.set(week, countByWeek.get(week) + 1);
  }
  console.log(countByWeek);
  const averageByWeek = new Map();
  for (let week of totalsByWeek.keys()) {
    averageByWeek.set(week, totalsByWeek.get(week)/countByWeek.get(week));
  }
  return averageByWeek;
}
