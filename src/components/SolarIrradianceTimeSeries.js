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
  Dimensions,
} from 'react-native';
import styles from './ForecastView-styles.js';
import {VictoryChart, VictoryLine, VictoryAxis, VictoryLabel, VictoryPortal} from 'victory';

export default function ({location, temporalResolution, startDate, endDate}) {
  const [series, loading] = useIrradianceData(location, temporalResolution, startDate, endDate);
  if (loading) {
    return <Loading/>;
  }
  const points = [...series.entries()].sort(([ka, va],[kb, vb]) => {
    return moment(ka, 'gggg-ww').toDate() - moment(kb, 'gggg-ww').toDate()
  });
  const labels = points.map(([key, value]) => moment(key, 'gggg-ww').format('MMM D, YYYY'));
  return (
    <View style={[styles.container, {backgroundColor: '#ffffff', flex: 0.9}]}>
      <VictoryChart
        width={Dimensions.get('window').width}
        height={330}
      >
        <VictoryLine
          data={points.map(([key, value]) => ({x: key, y: value}))}
        />
        <VictoryAxis tickCount={3} tickFormat={tick => moment(tick, 'gggg-ww').format('MMM D, YYYY')} label='First day of week'/>
        <VictoryAxis
          dependentAxis
          label={'Kilowatt-hours received from the Sun\nper square meter per day'}
          style={{
            axisLabel: {padding: 40}
          }}
          axisLabelComponent={<VictoryPortal><VictoryLabel/></VictoryPortal>}
        />
      </VictoryChart>
    </View>
  );
}

function useIrradianceData(location, temporalResolution, startDate, endDate) {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState(null);
  useEffect(() => {
    let url;
    url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${location.coords.longitude}&latitude=${location.coords.latitude}&start=${startDate.format('YYYYMMDD')}&end=${endDate.format('YYYYMMDD')}&format=JSON`;
    const USE_PREDOWNLOADED_DATA = false;

    setLoading(true);

    if (USE_PREDOWNLOADED_DATA) {
      import('../../data/predownloaded-irradiance-data.json').then(onDataReceived);
      return;
    }

    fetch(url).then(r => r.json()).then(onDataReceived).catch(err => console.table(err));

    function onDataReceived(data) {
      if (temporalResolution === 'week') {
        setSeries(computeWeeklyAverage(data.properties.parameter.ALLSKY_SFC_SW_DWN));
      } else if (temporalResolution === 'month') {
        setSeries(computeMonthlyAverage(data.properties.parameter.ALLSKY_SFC_SW_DWN));
      }
      setLoading(false);
    }
  }, [location.coords.longitude, location.coords.latitude, temporalResolution, startDate.toISOString(), endDate.toISOString()]);
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

function computeMonthlyAverage(dailyPoints) {
  const totalsByMonth = new Map();
  const countByMonth = new Map();
  for (let date in dailyPoints) {
    if (dailyPoints[date] < 0) {
      continue;
    }
    const month = moment(date, 'YYYYMMDD').format('YYYY-MM');
    if (!totalsByMonth.has(month)) {
      totalsByMonth.set(month, 0);
      countByMonth.set(month, 0);
    }
    totalsByMonth.set(month, totalsByMonth.get(month) + dailyPoints[date]);
    countByMonth.set(month, countByMonth.get(month) + 1);
  }
  const averageByMonth = new Map();
  for (let month of totalsByMonth.keys()) {
    averageByMonth.set(month, totalsByMonth.get(month)/countByMonth.get(month));
  }
  return averageByMonth;
}
