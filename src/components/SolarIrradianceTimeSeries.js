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
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from "react-native-chart-kit";

export default function ({location, temporalResolution, startDate, endDate}) {
  const [series, loading] = useIrradianceData(location, temporalResolution, startDate, endDate);
  if (loading) {
    return <Loading/>;
  }
  const yAxisIntervals = {
    week: 6.5,
    month: 1,
  };
  let pointsToHideByIndex = Array.from({length: [...series.keys()].length}, (v, k) => (k%2 === 0) ? null : k);
  if (temporalResolution === 'week') {
    pointsToHideByIndex = Array.from({length: [...series.keys()].length}, (v, k) => (k%13 === 0) ? null : k)
  }
  console.log(series);
  return (
    <LineChart
      data={{
        labels: [...series.keys()],
        datasets: [
          {
            data: [...series.values()]
          }
        ]
      }}
      width={Dimensions.get('window').width}
      height={220}
      yAxisInterval={yAxisIntervals[temporalResolution]}
      hidePointsAtIndex={pointsToHideByIndex}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        decimalPlaces: 2, // optional, defaults to 2dp
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
          borderRadius: 16
        },
        propsForDots: {
          r: "3",
          strokeWidth: "2",
          stroke: "#000000"
        }
      }}
      bezier
      style={{
        marginVertical: 8,
        borderRadius: 16
      }}
    />
  );
}

function useIrradianceData(location, temporalResolution, startDate, endDate) {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState(null);
  useEffect(() => {
    let url;
    url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${location.coords.longitude}&latitude=${location.coords.latitude}&start=${startDate.format('YYYYMMDD')}&end=${endDate.format('YYYYMMDD')}&format=JSON`;

    setLoading(true);
    fetch(url).then(r => r.json()).then(data => {
      if (temporalResolution === 'week') {
        setSeries(computeWeeklyAverage(data.properties.parameter.ALLSKY_SFC_SW_DWN));
      } else if (temporalResolution === 'month') {
        setSeries(computeMonthlyAverage(data.properties.parameter.ALLSKY_SFC_SW_DWN));
      }
      setLoading(false);
    });
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
