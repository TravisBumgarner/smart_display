import React from 'react'
import styled from 'styled-components'

import { mbta } from '../../services'
import { useInterval } from '../../utilities'
import { Header, Text } from '../'

const StopWrapper = styled.div`
    margin-right: 1em; 
    border-left: 2px solid white;
    padding-left: 10px;
`

const StopsWrapper = styled.div`
    display: flex;
`

const TimesWrapper = styled.div`
    margin-top: 0.5em;
`

const STOPS = [
    {
        id: '2773',
        nickname: 'Police Station to Sullivan'
    },
    {
        id: '2774',
        nickname: 'Dealership to Sullivan'
    },
    {
        id: '2610',
        nickname: 'Police Station to Reservoir'
    },
]

const ROUTES = ['86', '91', '747']

const STOP_IDS = STOPS.map(({ id }) => id)

const calculateTimeToDeparture = (dateStr) => {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const difference_in_seconds = Math.floor((then - now) / 1000)

    if (difference_in_seconds <= 0) {
        return '0s'
    } else if (difference_in_seconds < 60) {
        const seconds = difference_in_seconds < 10 ? '0' + difference_in_seconds : difference_in_seconds
        return `${seconds}s`
    } else {
        const minutes = Math.floor(difference_in_seconds / 60)
        return `${minutes}m`
    }


}

const ROUTE_LOOKUP = {
    '86': '86',
    '91': '91',
    '747': 'CT2'
}

const getStopPredictions = (stop) => {
    const predictions = mbta
        .predictions(stop)
        .then(predictions => {
            return predictions.map(prediction => {
                const route = ROUTE_LOOKUP[prediction.relationships.route.data.id]
                const timeToDeparture = calculateTimeToDeparture(prediction.attributes.departure_time)
                return { route, timeToDeparture }
            })
        })
    return predictions
}

const getAllPredictions = () => {
    const predictions = Promise
        .all(STOP_IDS.map(id => getStopPredictions(id)))
        .then(predictionsForStop => {
            const output = {}
            predictionsForStop.forEach((prediction, index) => {
                const stopId = STOP_IDS[index]
                output[stopId] = prediction
            })
            return output
        })
    return predictions
}

const Times = () => {
    const [predictions, setPredictions] = React.useState<any>({})
    const [lastUpdated, setLastUpdated] = React.useState(null)

    const fetchPredictions = () => {
        getAllPredictions().then(setPredictions)
        setLastUpdated(new Date().toLocaleTimeString())
    }

    React.useEffect(() => { fetchPredictions() }, [])
    useInterval(() => { fetchPredictions() }, 10000)

    const Predictions = STOP_IDS.map(id => {
        if (!Object.keys(predictions).length) {
            return
        }

        const predictionsByRoute = {}
        predictions[id]
            .forEach(({ route, timeToDeparture }) => {
                (route in predictionsByRoute)
                    ? predictionsByRoute[route].push(timeToDeparture)
                    : predictionsByRoute[route] = [timeToDeparture]
            })

        const PredictionsByRoute = Object.keys(predictionsByRoute).map(key => <li key={key}>{key} - {predictionsByRoute[key].join('  |  ')}</li>)

        const { nickname } = STOPS.find((stop) => stop.id === id)

        return (
            <StopWrapper>
                <Header size="small">{nickname} </Header>
                <ul key={id}>
                    {PredictionsByRoute}
                </ul>
            </StopWrapper>
        )
    })

    return (
        <TimesWrapper>
            <Header size="medium">Next Stop  (Last Updated: {lastUpdated})</Header>
            <StopsWrapper>
                {Predictions}
            </StopsWrapper>
        </TimesWrapper>
    )
}

export default Times