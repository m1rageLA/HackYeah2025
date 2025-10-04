import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import './App.css'
import {
  getDivisionViewModels,
  getFrontGeometries,
} from './warMath.js'

const initialFronts = [
  {
    id: 'north',
    name: 'Северный сектор',
    objective: 'Брест и переправы через Буг',
    color: '#38bdf8',
    width: 18500,
    startPath: [
      { lat: 53.16, lng: 23.22 },
      { lat: 52.82, lng: 23.85 },
      { lat: 52.46, lng: 24.38 },
    ],
    advancePath: [
      { lat: 53.28, lng: 23.8 },
      { lat: 52.98, lng: 24.47 },
      { lat: 52.63, lng: 25.12 },
    ],
    state: 'preparing',
    progress: 0.18,
    readiness: 78,
    supply: 83,
    reportedLosses: 460,
    commander: 'Генерал Орлов',
    doctrine: 'Мобильная оборона',
    intel: 'Отмечена концентрация артиллерии противника на высотах к северу от Бреста.',
  },
  {
    id: 'center',
    name: 'Центральный участок',
    objective: 'Люблин и господство над железной дорогой',
    color: '#10b981',
    width: 21000,
    startPath: [
      { lat: 51.54, lng: 22.83 },
      { lat: 51.08, lng: 23.48 },
      { lat: 50.61, lng: 23.96 },
    ],
    advancePath: [
      { lat: 51.68, lng: 23.42 },
      { lat: 51.21, lng: 24.18 },
      { lat: 50.82, lng: 24.81 },
    ],
    state: 'advancing',
    progress: 0.32,
    readiness: 71,
    supply: 65,
    reportedLosses: 1320,
    commander: 'Генерал Громов',
    doctrine: 'Глубокий прорыв',
    intel: 'Противник выводит резервы из Замосця, отмечены колонны мотопехоты.',
  },
  {
    id: 'south',
    name: 'Карпатская дуга',
    objective: 'Перехватить перевалы к Львову',
    color: '#f97316',
    width: 19500,
    startPath: [
      { lat: 49.98, lng: 22.32 },
      { lat: 49.63, lng: 23.04 },
      { lat: 49.24, lng: 23.62 },
    ],
    advancePath: [
      { lat: 50.12, lng: 22.94 },
      { lat: 49.79, lng: 23.73 },
      { lat: 49.38, lng: 24.41 },
    ],
    state: 'idle',
    progress: 0.08,
    readiness: 88,
    supply: 74,
    reportedLosses: 240,
    commander: 'Генерал Сыч',
    doctrine: 'Горная пехота',
    intel: 'В горах усиливается снегопад, дороги требуют расчистки.',
  },
]

const initialDivisions = [
  {
    id: '1pz',
    name: '1-я танковая армия',
    faction: 'friendly',
    type: 'armor',
    strength: 92,
    organization: 81,
    experience: 'закалённая',
    commander: 'Ген. Ветров',
    logistics: 76,
    status: 'frontline',
    assignment: { frontId: 'center', anchor: 0.34, depth: -5400 },
    position: { lat: 51.24, lng: 23.44 },
  },
  {
    id: '5inf',
    name: '5-й стрелковый корпус',
    faction: 'friendly',
    type: 'infantry',
    strength: 85,
    organization: 73,
    experience: 'закалённая',
    commander: 'Ген. Лапин',
    logistics: 68,
    status: 'frontline',
    assignment: { frontId: 'center', anchor: 0.58, depth: -6200 },
    position: { lat: 50.9, lng: 23.86 },
  },
  {
    id: '7inf',
    name: '7-я горнострелковая дивизия',
    faction: 'friendly',
    type: 'infantry',
    strength: 78,
    organization: 69,
    experience: 'ветераны гор',
    commander: 'Ген. Кравец',
    logistics: 82,
    status: 'frontline',
    assignment: { frontId: 'south', anchor: 0.46, depth: -5800 },
    position: { lat: 49.54, lng: 23.2 },
  },
  {
    id: 'res-2',
    name: '2-й резервный механизированный корпус',
    faction: 'friendly',
    type: 'armor',
    strength: 76,
    organization: 64,
    experience: 'обученная',
    commander: 'Ген. Шумский',
    logistics: 71,
    status: 'reserve',
    assignment: null,
    position: { lat: 52.05, lng: 22.92 },
  },
  {
    id: 'north-12',
    name: '12-й стрелковый корпус',
    faction: 'friendly',
    type: 'infantry',
    strength: 88,
    organization: 77,
    experience: 'регулярная',
    commander: 'Ген. Платов',
    logistics: 79,
    status: 'frontline',
    assignment: { frontId: 'north', anchor: 0.42, depth: -6000 },
    position: { lat: 52.86, lng: 23.65 },
  },
  {
    id: 'enemy-1',
    name: '27-я пехотная армия',
    faction: 'enemy',
    type: 'infantry',
    strength: 83,
    organization: 74,
    status: 'entrenched',
    assignment: { frontId: 'north', anchor: 0.46, depth: 5200 },
    position: { lat: 52.92, lng: 24.32 },
  },
  {
    id: 'enemy-2',
    name: '8-я моторизованная армия',
    faction: 'enemy',
    type: 'armor',
    strength: 79,
    organization: 69,
    status: 'probing',
    assignment: { frontId: 'center', anchor: 0.38, depth: 5400 },
    position: { lat: 51.36, lng: 24.36 },
  },
  {
    id: 'enemy-3',
    name: '15-й горный корпус',
    faction: 'enemy',
    type: 'infantry',
    strength: 71,
    organization: 65,
    status: 'entrenched',
    assignment: { frontId: 'south', anchor: 0.33, depth: 6400 },
    position: { lat: 49.74, lng: 24.01 },
  },
  {
    id: 'enemy-4',
    name: 'Резервная пехота Висла',
    faction: 'enemy',
    type: 'infantry',
    strength: 62,
    organization: 55,
    status: 'reserve',
    assignment: null,
    position: { lat: 52.18, lng: 25.12 },
  },
]

const weatherByMonth = ['Прохладно и ясно', 'Дождь и туман', 'Мороз и снег', 'Облачно']

const formatGameDate = (date) => {
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const formatGameTime = (date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const FRONT_THRESHOLDS = [0.25, 0.5, 0.75]

function App() {
  const [fronts, setFronts] = useState(initialFronts)
  const [divisions, setDivisions] = useState(initialDivisions)
  const [selectedFrontId, setSelectedFrontId] = useState(initialFronts[1].id)
  const [selectedDivisionId, setSelectedDivisionId] = useState(initialDivisions[0].id)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [battleLog, setBattleLog] = useState([
    {
      id: 'initial',
      time: '05:00',
      severity: 'info',
      message: 'Штаб сформирован. Начато наблюдение за линией фронта.',
    },
  ])
  const [gameDate, setGameDate] = useState(() => new Date('1941-10-12T05:00:00Z'))

  const gameDateRef = useRef(gameDate)
  const milestoneRef = useRef({})

  useEffect(() => {
    gameDateRef.current = gameDate
  }, [gameDate])

  const addLogEntry = useCallback((message, severity = 'info') => {
    setBattleLog((prev) => {
      const time = formatGameTime(gameDateRef.current)
      const entry = { id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, time, severity, message }
      return [entry, ...prev].slice(0, 9)
    })
  }, [])

  const frontGeometries = useMemo(() => getFrontGeometries(fronts), [fronts])
  const divisionViewModels = useMemo(
    () => getDivisionViewModels(divisions, frontGeometries),
    [divisions, frontGeometries],
  )

  const selectedFront = frontGeometries.find((front) => front.id === selectedFrontId) ?? frontGeometries[0]
  const selectedDivision =
    divisionViewModels.find((division) => division.id === selectedDivisionId) ?? divisionViewModels[0]

  const friendlyDivisions = useMemo(
    () => divisionViewModels.filter((division) => division.faction === 'friendly'),
    [divisionViewModels],
  )
  const enemyDivisions = useMemo(
    () => divisionViewModels.filter((division) => division.faction === 'enemy'),
    [divisionViewModels],
  )

  const averageFriendlyStrength = useMemo(() => {
    if (friendlyDivisions.length === 0) {
      return 0
    }
    const total = friendlyDivisions.reduce((acc, division) => acc + division.strength, 0)
    return Math.round(total / friendlyDivisions.length)
  }, [friendlyDivisions])

  const averageFrontReadiness = useMemo(() => {
    if (fronts.length === 0) {
      return 0
    }
    const total = fronts.reduce((acc, front) => acc + front.readiness, 0)
    return Math.round(total / fronts.length)
  }, [fronts])

  const averageFrontSupply = useMemo(() => {
    if (fronts.length === 0) {
      return 0
    }
    const total = fronts.reduce((acc, front) => acc + front.supply, 0)
    return Math.round(total / fronts.length)
  }, [fronts])

  const currentWeather = weatherByMonth[gameDate.getMonth() % weatherByMonth.length]

  useEffect(() => {
    if (isPaused) {
      return undefined
    }

    const loop = window.setInterval(() => {
      const advancedFrontIds = new Set()
      const milestoneMessages = []

      setFronts((prevFronts) => {
        let changed = false

        const updated = prevFronts.map((front) => {
          if (front.state !== 'advancing' || front.progress >= 1) {
            return front
          }

          const readinessFactor = Math.max(0.45, front.readiness / 100)
          const supplyFactor = Math.max(0.5, front.supply / 100)
          const momentum = 0.012 * speed * readinessFactor * supplyFactor
          const nextProgress = Math.min(1, front.progress + momentum)
          const readinessLoss = momentum * 140
          const supplyLoss = momentum * 95
          let nextReadiness = Math.max(0, front.readiness - readinessLoss)
          let nextSupply = Math.max(0, front.supply - supplyLoss)
          let nextState = front.state

          if (nextProgress >= 1) {
            nextState = 'secured'
            milestoneMessages.push(`Фронт «${front.name}» выполнил задачу: ${front.objective}.`)
          } else if (nextReadiness < 18 || nextSupply < 18) {
            nextState = 'stalled'
            milestoneMessages.push(`Наступление «${front.name}» остановлено из-за усталости частей.`)
          }

          FRONT_THRESHOLDS.forEach((threshold) => {
            const previous = milestoneRef.current[`${front.id}-${threshold}`] ?? 0
            if (nextProgress >= threshold && previous < threshold) {
              milestoneRef.current[`${front.id}-${threshold}`] = threshold
              milestoneMessages.push(
                `«${front.name}» продвинулся на ${Math.round(threshold * 100)}% к цели (${front.objective}).`,
              )
            }
          })

          advancedFrontIds.add(front.id)
          changed = true

          return {
            ...front,
            progress: nextProgress,
            readiness: nextReadiness,
            supply: nextSupply,
            state: nextState,
            reportedLosses: front.reportedLosses + momentum * 2200,
          }
        })

        if (!changed) {
          return prevFronts
        }

        return updated
      })

      if (advancedFrontIds.size > 0) {
        setDivisions((prevDivisions) => {
          let changed = false

          const updated = prevDivisions.map((division) => {
            if (!division.assignment || !advancedFrontIds.has(division.assignment.frontId)) {
              return division
            }

            const isFriendly = division.faction === 'friendly'
            const orgLoss = (isFriendly ? 1.5 : 1.1) * speed
            const strengthLoss = (isFriendly ? 0.6 : 0.9) * speed
            const nextOrg = Math.max(0, division.organization - orgLoss)
            const nextStrength = Math.max(0, division.strength - strengthLoss)

            let nextStatus = division.status
            if (nextOrg < 25) {
              nextStatus = 'exhausted'
            } else if (isFriendly && nextStatus === 'reserve') {
              nextStatus = 'frontline'
            } else if (!isFriendly && nextOrg < 45) {
              nextStatus = 'probing'
            }

            changed = true
            return {
              ...division,
              organization: nextOrg,
              strength: nextStrength,
              status: nextStatus,
            }
          })

          if (!changed) {
            return prevDivisions
          }

          return updated
        })
      }

      if (milestoneMessages.length > 0) {
        milestoneMessages.forEach((message) => addLogEntry(message, 'info'))
      }
    }, 3200 / speed)

    return () => window.clearInterval(loop)
  }, [isPaused, speed, addLogEntry])

  useEffect(() => {
    if (isPaused) {
      return undefined
    }

    const clock = window.setInterval(() => {
      setGameDate((prev) => new Date(prev.getTime() + 1000 * 60 * 90 * speed))
    }, 3800 / speed)

    return () => window.clearInterval(clock)
  }, [isPaused, speed])

  const handleSelectFront = useCallback((frontId) => {
    setSelectedFrontId(frontId)
  }, [])

  const handleSelectDivision = useCallback((divisionId) => {
    setSelectedDivisionId(divisionId)
  }, [])

  const handleLaunchOffensive = useCallback(
    (frontId) => {
      let canAdvance = false
      let objective = ''

      setFronts((prevFronts) =>
        prevFronts.map((front) => {
          if (front.id !== frontId) {
            return front
          }

          canAdvance = front.readiness > 25 && front.supply > 25
          objective = front.objective
          if (!canAdvance) {
            return {
              ...front,
              state: 'stalled',
            }
          }

          milestoneRef.current[`${front.id}-0`] = 0
          FRONT_THRESHOLDS.forEach((threshold) => {
            milestoneRef.current[`${front.id}-${threshold}`] = front.progress >= threshold ? threshold : 0
          })

          return {
            ...front,
            state: 'advancing',
            progress: Math.max(front.progress, 0.02),
          }
        }),
      )

      if (canAdvance) {
        setDivisions((prevDivisions) =>
          prevDivisions.map((division) => {
            if (division.assignment?.frontId !== frontId || division.faction !== 'friendly') {
              return division
            }
            return {
              ...division,
              status: 'attacking',
              organization: Math.max(0, division.organization - 2.5),
            }
          }),
        )
        addLogEntry(`Наступление начато: ${objective}.`, 'success')
      } else {
        addLogEntry('Наступление невозможно: требуются снабжение и перегруппировка.', 'warning')
      }
    },
    [addLogEntry],
  )

  const handlePauseFront = useCallback(
    (frontId) => {
      setFronts((prev) =>
        prev.map((front) => {
          if (front.id !== frontId) {
            return front
          }
          return {
            ...front,
            state: 'regrouping',
            readiness: Math.min(100, front.readiness + 6),
            supply: Math.min(100, front.supply + 8),
          }
        }),
      )
      setDivisions((prev) =>
        prev.map((division) => {
          if (division.assignment?.frontId !== frontId || division.faction !== 'friendly') {
            return division
          }
          return {
            ...division,
            status: 'reorganizing',
            organization: Math.min(100, division.organization + 3.5),
          }
        }),
      )
      addLogEntry('Продвижение остановлено. Части приводятся в порядок.', 'info')
    },
    [addLogEntry],
  )

  const handleResupplyFront = useCallback(
    (frontId) => {
      setFronts((prev) =>
        prev.map((front) => {
          if (front.id !== frontId) {
            return front
          }
          return {
            ...front,
            state: 'preparing',
            readiness: Math.min(100, front.readiness + 12),
            supply: Math.min(100, front.supply + 18),
          }
        }),
      )
      setDivisions((prev) =>
        prev.map((division) => {
          if (division.assignment?.frontId !== frontId || division.faction !== 'friendly') {
            return division
          }
          return {
            ...division,
            status: 'resupplying',
            organization: Math.min(100, division.organization + 4.5),
            logistics: Math.min(100, (division.logistics ?? 70) + 3),
          }
        }),
      )
      addLogEntry('На фронт отправлены дополнительные колонны снабжения.', 'success')
    },
    [addLogEntry],
  )

  const handleDigInFront = useCallback(
    (frontId) => {
      setFronts((prev) =>
        prev.map((front) => {
          if (front.id !== frontId) {
            return front
          }
          return {
            ...front,
            state: 'idle',
            readiness: Math.min(100, front.readiness + 9),
            supply: Math.max(0, front.supply - 4),
          }
        }),
      )
      addLogEntry('Инженерные батальоны усиливают оборону участка фронта.', 'info')
    },
    [addLogEntry],
  )

  const handleFrontToggle = useCallback(
    (frontId) => {
      const front = fronts.find((entry) => entry.id === frontId)
      if (!front) {
        return
      }
      if (front.state === 'advancing') {
        handlePauseFront(frontId)
      } else {
        handleLaunchOffensive(frontId)
      }
    },
    [fronts, handlePauseFront, handleLaunchOffensive],
  )

  const handleDivisionOrder = useCallback(
    (divisionId, order) => {
      setDivisions((prev) =>
        prev.map((division) => {
          if (division.id !== divisionId) {
            return division
          }

          if (division.faction === 'enemy' && order === 'airstrike') {
            const nextOrg = Math.max(0, division.organization - 12)
            const nextStrength = Math.max(0, division.strength - 4)
            addLogEntry(`Авиация нанесла удар по ${division.name}.`, 'success')
            return {
              ...division,
              organization: nextOrg,
              strength: nextStrength,
              status: 'entrenched',
            }
          }

          if (division.faction !== 'friendly') {
            return division
          }

          if (order === 'support') {
            addLogEntry(`${division.name} усиливает удар на переднем крае.`, 'success')
            return {
              ...division,
              status: 'attacking',
              organization: Math.max(0, division.organization - 6),
              assignment: division.assignment
                ? { ...division.assignment, depth: Math.min(-2600, division.assignment.depth - 800) }
                : division.assignment,
            }
          }

          if (order === 'fallback') {
            addLogEntry(`${division.name} выводится в резерв и восстанавливает силы.`, 'warning')
            return {
              ...division,
              status: 'reserve',
              organization: Math.min(100, division.organization + 12),
              strength: Math.min(100, division.strength + 4),
              assignment: division.assignment
                ? { ...division.assignment, depth: -9200 }
                : division.assignment,
            }
          }

          if (order === 'resupply') {
            addLogEntry(`${division.name} получает приоритет снабжения.`, 'info')
            return {
              ...division,
              status: 'resupplying',
              organization: Math.min(100, division.organization + 9),
              strength: Math.min(100, division.strength + 2),
              logistics: Math.min(100, (division.logistics ?? 70) + 5),
            }
          }

          return division
        }),
      )
    },
    [addLogEntry],
  )

  const handleSpeedChange = useCallback((value) => {
    setSpeed(value)
  }, [])

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  useEffect(() => {
    milestoneRef.current = {}
  }, [])

  return (
    <div className="command-shell">
      <aside className="command-sidebar">
        <button
          type="button"
          className={`sidebar-button${isPaused ? ' sidebar-button--warning' : ' sidebar-button--primary'}`}
          onClick={togglePause}
        >
          {isPaused ? 'Продолжить' : 'Пауза'}
        </button>
        <div className="sidebar-divider" />
        <p className="sidebar-label">Скорость штаба</p>
        <div className="sidebar-speed">
          {[0.5, 1, 2].map((value) => (
            <button
              key={value}
              type="button"
              className={`sidebar-chip${speed === value ? ' sidebar-chip--active' : ''}`}
              onClick={() => handleSpeedChange(value)}
            >
              {value.toFixed(1)}×
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-stat">
          <span>Боеспособность</span>
          <strong>{averageFriendlyStrength}%</strong>
        </div>
        <div className="sidebar-stat">
          <span>Готовность фронтов</span>
          <strong>{averageFrontReadiness}%</strong>
        </div>
        <div className="sidebar-stat">
          <span>Снабжение</span>
          <strong>{averageFrontSupply}%</strong>
        </div>
      </aside>

      <main className="command-map-area">
        <div className="command-header">
          <div className="command-clock">
            <h1>Оперативный штаб</h1>
            <p>{formatGameDate(gameDate)}</p>
            <p>{currentWeather}</p>
          </div>
          <div className="command-overview">
            <div>
              <span>Наших дивизий</span>
              <strong>{friendlyDivisions.length}</strong>
            </div>
            <div>
              <span>Вражеских формирований</span>
              <strong>{enemyDivisions.length}</strong>
            </div>
            <div>
              <span>Линии фронта</span>
              <strong>{fronts.length}</strong>
            </div>
          </div>
        </div>
        <MapView
          fronts={frontGeometries}
          divisions={divisionViewModels}
          selectedFrontId={selectedFront?.id}
          selectedDivisionId={selectedDivision?.id}
          onSelectFront={handleSelectFront}
          onToggleFrontState={handleFrontToggle}
          onSelectDivision={handleSelectDivision}
        />
      </main>

      <aside className="command-panel">
        <section className="panel-section">
          <header className="panel-header">
            <h2>Линии фронта</h2>
            <span>Контроль оперативной обстановки</span>
          </header>
          <div className="front-list">
            {frontGeometries.map((front) => (
              <button
                key={front.id}
                type="button"
                className={`front-card${selectedFrontId === front.id ? ' front-card--active' : ''}`}
                onClick={() => handleSelectFront(front.id)}
              >
                <div className="front-card__head">
                  <h3>{front.name}</h3>
                  <span>{Math.round(front.progress * 100)}%</span>
                </div>
                <p>{front.objective}</p>
                <div className="front-card__bar">
                  <span style={{ width: `${Math.round(front.progress * 100)}%` }} />
                </div>
                <div className="front-card__stats">
                  <span>Готовность {Math.round(front.readiness)}%</span>
                  <span>Снабжение {Math.round(front.supply)}%</span>
                </div>
                <div className={`front-card__state front-card__state--${front.state}`}>
                  {front.state === 'advancing'
                    ? 'Наступление'
                    : front.state === 'preparing'
                      ? 'Готовимся'
                      : front.state === 'regrouping'
                        ? 'Перегруппировка'
                        : front.state === 'secured'
                          ? 'Цель достигнута'
                          : front.state === 'stalled'
                            ? 'Застой'
                            : 'Оборона'}
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedFront && (
          <section className="panel-section">
            <header className="panel-header">
              <h2>{selectedFront.name}</h2>
              <span>{selectedFront.commander}</span>
            </header>
            <div className="front-summary">
              <p className="front-summary__objective">{selectedFront.objective}</p>
              <p>Доктрина: {selectedFront.doctrine}</p>
              <p>Разведка: {selectedFront.intel}</p>
              <div className="front-summary__grid">
                <div>
                  <span>Прогресс</span>
                  <strong>{Math.round(selectedFront.progress * 100)}%</strong>
                </div>
                <div>
                  <span>Готовность</span>
                  <strong>{Math.round(selectedFront.readiness)}%</strong>
                </div>
                <div>
                  <span>Снабжение</span>
                  <strong>{Math.round(selectedFront.supply)}%</strong>
                </div>
                <div>
                  <span>Потери</span>
                  <strong>{Math.round(selectedFront.reportedLosses)} чел.</strong>
                </div>
              </div>
              <div className="front-actions">
                <button type="button" onClick={() => handleLaunchOffensive(selectedFront.id)}>
                  Запустить наступление
                </button>
                <button type="button" onClick={() => handlePauseFront(selectedFront.id)}>
                  Остановить продвижение
                </button>
                <button type="button" onClick={() => handleResupplyFront(selectedFront.id)}>
                  Перебросить снабжение
                </button>
                <button type="button" onClick={() => handleDigInFront(selectedFront.id)}>
                  Укрепить рубеж
                </button>
              </div>
            </div>
          </section>
        )}

        {selectedDivision && (
          <section className="panel-section">
            <header className="panel-header">
              <h2>{selectedDivision.name}</h2>
              <span>{selectedDivision.commander ?? 'Командир неизвестен'}</span>
            </header>
            <div className="division-summary">
              <div className="division-summary__grid">
                <div>
                  <span>Тип</span>
                  <strong>{selectedDivision.type === 'armor' ? 'Танковая' : 'Пехотная'}</strong>
                </div>
                <div>
                  <span>Боеспособность</span>
                  <strong>{Math.round(selectedDivision.strength)}%</strong>
                </div>
                <div>
                  <span>Организация</span>
                  <strong>{Math.round(selectedDivision.organization)}</strong>
                </div>
                <div>
                  <span>Логистика</span>
                  <strong>{Math.round(selectedDivision.logistics ?? 70)}%</strong>
                </div>
              </div>
              <p>
                Статус: <strong>{selectedDivision.status}</strong>
              </p>
              {selectedDivision.assignment && (
                <p>
                  Приписана к фронту: <strong>{selectedDivision.assignment.frontId.toUpperCase()}</strong>
                </p>
              )}

              {selectedDivision.faction === 'friendly' ? (
                <div className="division-actions">
                  <button type="button" onClick={() => handleDivisionOrder(selectedDivision.id, 'support')}>
                    Поддержать атаку
                  </button>
                  <button type="button" onClick={() => handleDivisionOrder(selectedDivision.id, 'fallback')}>
                    Отвести в резерв
                  </button>
                  <button type="button" onClick={() => handleDivisionOrder(selectedDivision.id, 'resupply')}>
                    Приоритет снабжения
                  </button>
                </div>
              ) : (
                <div className="division-actions">
                  <button type="button" onClick={() => handleDivisionOrder(selectedDivision.id, 'airstrike')}>
                    Отметить цель для авиации
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="panel-section">
          <header className="panel-header">
            <h2>Журнал событий</h2>
            <span>Последние распоряжения</span>
          </header>
          <ul className="log-list">
            {battleLog.map((entry) => (
              <li key={entry.id} className={`log-item log-item--${entry.severity}`}>
                <span className="log-item__time">{entry.time}</span>
                <p>{entry.message}</p>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}

export default App
