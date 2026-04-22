// @ts-nocheck
'use strict'

if (typeof Vue === 'undefined') {
    console.error('Vue no está cargado. Verifica que vue.global.js esté disponible.')
}

const { createApp } = Vue

const app = createApp({
    data() { 
        return {
            // ========================================
            // AUTENTICACIÓN
            // ========================================
            isLoggedIn: false,
            currentUser: '',
            loginMatricula: '',
            loginPassword: '',
            loginError: '',
            
            // Usuarios dummy (matrícula: contraseña)
            usuarios: {
                '123456': 'pass123',
                '654321': 'pass456',
                'admin': 'admin'
            },
            
            // ========================================
            // UI STATE
            // ========================================
            currentView: 'revisar',
            clockPlaceholder: '00:00:00',
            currentTime: Date.now(), // Para reactividad en computed properties
            
            // ========================================
            // ESTACIONAMIENTOS CON PERSISTENCIA
            // ========================================
            selectedParkingId: '1',
            
            parkingNames: {
                '1': 'Estacionamiento Norte',
                '2': 'Estacionamiento Sur'
            },
            
            // ALMACENAMIENTO PERSISTENTE: Estados de todos los estacionamientos
            // Este objeto mantiene el estado de TODOS los cajones de TODOS los estacionamientos
            // Cada cajón tiene: id, numero, estado, ocupadoDesde (timestamp local)
            parkingData: {
                '1': [
                    { id: 1, numero: 'PS001', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 2, numero: 'PS002', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 3, numero: 'PS003', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 4, numero: 'PS004', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 5, numero: 'PS005', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 6, numero: 'PS006', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 7, numero: 'PS007', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 8, numero: 'PS008', estado: 'libre', ocupadoDesde: null, timestamp: null }
                ],
                '2': [
                    { id: 1, numero: 'PS001', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 2, numero: 'PS002', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 3, numero: 'PS003', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 4, numero: 'PS004', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 5, numero: 'PS005', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 6, numero: 'PS006', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 7, numero: 'PS007', estado: 'libre', ocupadoDesde: null, timestamp: null },
                    { id: 8, numero: 'PS008', estado: 'libre', ocupadoDesde: null, timestamp: null }
                ]
            },
            
            // Cajones actuales mostrados (referencia directa a parkingData)
            currentSpots: [],
            
            // ========================================
            // RESERVAS
            // ========================================
            selectedSpot: null,
            minutosHastaLlegada: '',
            reservaHoraInicio: '',
            reservaHoraFin: '',
            reservaConfirmada: false,
            
            // Tracking de reservas por usuario
            userReservations: {},
            
            // Horarios de reserva por usuario
            userReservationSchedules: {},
            
            // ========================================
            // ESTADÍSTICAS
            // ========================================
            horaConsulta: '',
            rotacionHoy: '0 veces',
            
            // Datos de predicción en tiempo real desde MySQL
            prediccionData: null,
            prediccionLoading: false,
            prediccionError: '',
            timestampConsultaActual: null,
            
            // Datos históricos simulados (se llenarán desde Node-RED)
            historicalData: {
                '1': {
                    '08:00': { libres: 5, ocupados: 3 },
                    '09:00': { libres: 3, ocupados: 5 },
                    '10:00': { libres: 2, ocupados: 6 },
                    '11:00': { libres: 4, ocupados: 4 },
                    '12:00': { libres: 6, ocupados: 2 },
                    '13:00': { libres: 5, ocupados: 3 },
                    '14:00': { libres: 4, ocupados: 4 },
                    '15:00': { libres: 3, ocupados: 5 },
                    '16:00': { libres: 5, ocupados: 3 },
                    '17:00': { libres: 7, ocupados: 1 }
                },
                '2': {
                    '08:00': { libres: 4, ocupados: 4 },
                    '09:00': { libres: 2, ocupados: 6 },
                    '10:00': { libres: 1, ocupados: 7 },
                    '11:00': { libres: 3, ocupados: 5 },
                    '12:00': { libres: 5, ocupados: 3 },
                    '13:00': { libres: 4, ocupados: 4 },
                    '14:00': { libres: 3, ocupados: 5 },
                    '15:00': { libres: 2, ocupados: 6 },
                    '16:00': { libres: 4, ocupados: 4 },
                    '17:00': { libres: 6, ocupados: 2 }
                }
            }
        }
    },

    computed: {
        // ====================
        // CONTADORES DE ESTADO
        // ====================
        selectedParkingName() {
            return this.parkingNames[this.selectedParkingId] || 'Estacionamiento'
        },
        
        libresCount() {
            return this.currentSpots.filter(spot => spot.estado === 'libre').length
        },
        
        ocupadosCount() {
            return this.currentSpots.filter(spot => spot.estado === 'ocupado').length
        },
        
        reservadosCount() {
            return this.currentSpots.filter(spot => spot.estado === 'reservado').length
        },
        
        userAlreadyHasReservation() {
            return this.userReservations.hasOwnProperty(this.currentUser)
        },
        
        // ====================
        // VALIDACIONES DE RESERVA
        // ====================
        isFormValid() {
            // Verificar que se hayan seleccionado minutos y hora fin
            if (this.minutosHastaLlegada === '' || !this.reservaHoraFin) return false
            
            // Verificar que hora fin sea después de hora inicio calculada
            if (!this.reservaHoraInicio) return false
            
            const [hi, mi] = this.reservaHoraInicio.split(':').map(Number)
            const [hf, mf] = this.reservaHoraFin.split(':').map(Number)
            
            // Obtener hora actual
            const ahora = new Date(this.currentTime)
            const horaActual = ahora.getHours()
            const minActual = ahora.getMinutes()
            
            // VALIDACIÓN: La hora fin NO puede estar entre hora actual y hora de llegada
            // PERO SÍ puede ser desde (hora de llegada + 1 minuto) en adelante
            const horaFinEnMinutos = hf * 60 + mf
            const horaInicioEnMinutos = hi * 60 + mi
            const horaActualEnMinutos = horaActual * 60 + minActual
            
            // Si la hora fin está entre la hora actual y la hora de llegada (sin incluir llegada), es inválido
            if (horaFinEnMinutos > horaActualEnMinutos && horaFinEnMinutos <= horaInicioEnMinutos) {
                return false
            }
            
            // Si hora fin es menor o igual que hora inicio (mismo día), es inválido
            // NOTA: Solo se permite si cruza medianoche (día siguiente)
            if (horaFinEnMinutos <= horaInicioEnMinutos) {
                // Verificar si realmente cruza medianoche
                // Si la hora fin es menor, asumimos día siguiente
                if (horaFinEnMinutos >= horaInicioEnMinutos) {
                    return false
                }
                // Si horaFin < horaInicio, es válido (día siguiente)
            }
            
            return true
        },
        
        // Hora inicio calculada en formato HH:MM
        horaInicioCalculadaStr() {
            if (this.minutosHastaLlegada === '') return this.horaActualStr
            
            const now = new Date(this.currentTime)
            now.setMinutes(now.getMinutes() + parseInt(this.minutosHastaLlegada))
            const horas = String(now.getHours()).padStart(2, '0')
            const minutos = String(now.getMinutes()).padStart(2, '0')
            return `${horas}:${minutos}`
        },
        
        // Hora actual en formato HH:MM
        horaActualStr() {
            const now = new Date(this.currentTime)
            const horas = String(now.getHours()).padStart(2, '0')
            const minutos = String(now.getMinutes()).padStart(2, '0')
            return `${horas}:${minutos}`
        },
        
        // Detectar si la hora fin es del día siguiente
        esDiaSiguiente() {
            if (!this.reservaHoraInicio || !this.reservaHoraFin) return false
            
            const [hi, mi] = this.reservaHoraInicio.split(':').map(Number)
            const [hf, mf] = this.reservaHoraFin.split(':').map(Number)
            
            const inicioEnMinutos = hi * 60 + mi
            const finEnMinutos = hf * 60 + mf
            
            // Obtener hora actual para verificar intervalo prohibido
            const ahora = new Date(this.currentTime)
            const horaActual = ahora.getHours()
            const minActual = ahora.getMinutes()
            const horaActualEnMinutos = horaActual * 60 + minActual
            
            // NO mostrar mensaje si está en el intervalo prohibido
            if (finEnMinutos > horaActualEnMinutos && finEnMinutos <= inicioEnMinutos) {
                return false
            }
            
            // Mostrar mensaje cuando la hora fin es MENOR que la hora inicio
            // Esto indica que cruzamos medianoche
            return finEnMinutos < inicioEnMinutos
        },
        
        // ====================
        // ESTADÍSTICAS LOCALES (formato Xh Xm)
        // ====================
        cajonesOcupados() {
            // Usar currentTime como dependencia para forzar recálculo cada segundo
            const ahora = this.currentTime
            return this.currentSpots
                .filter(spot => spot.estado === 'ocupado' && spot.ocupadoDesde)
                .map(spot => {
                    const diferencia = ahora - spot.ocupadoDesde
                    const horas = Math.floor(diferencia / 3600000)
                    const minutos = Math.floor((diferencia % 3600000) / 60000)
                    
                    // Calcular hora de inicio LOCAL
                    const horaInicio = new Date(spot.ocupadoDesde)
                    const horaInicioStr = `${String(horaInicio.getHours()).padStart(2, '0')}:${String(horaInicio.getMinutes()).padStart(2, '0')}`
                    
                    return {
                        numero: spot.numero,
                        tiempoOcupado: `${horas}h ${minutos}m`,
                        horaInicio: horaInicioStr,
                        minutosTotales: Math.floor(diferencia / 60000),
                        porcentaje: Math.min((diferencia / (6 * 3600000)) * 100, 100) // max 6 horas
                    }
                })
                .sort((a, b) => b.minutosTotales - a.minutosTotales)
        },
        
        cajonesReservados() {
            // Usar currentTime como dependencia para forzar recálculo cada segundo
            const ahora = this.currentTime
            return this.currentSpots
                .filter(spot => spot.estado === 'reservado')
                .map(spot => {
                    if (spot.ocupadoDesde) {
                        const diferencia = ahora - spot.ocupadoDesde
                        const horas = Math.floor(diferencia / 3600000)
                        const minutos = Math.floor((diferencia % 3600000) / 60000)
                        
                        // Calcular hora de inicio LOCAL
                        const horaInicio = new Date(spot.ocupadoDesde)
                        const horaInicioStr = `${String(horaInicio.getHours()).padStart(2, '0')}:${String(horaInicio.getMinutes()).padStart(2, '0')}`
                        
                        return {
                            numero: spot.numero,
                            tiempoReservado: `${horas}h ${minutos}m`,
                            horaInicio: horaInicioStr,
                            minutosTotales: Math.floor(diferencia / 60000),
                            porcentaje: Math.min((diferencia / (6 * 3600000)) * 100, 100)
                        }
                    }
                    return {
                        numero: spot.numero,
                        tiempoReservado: '0h 0m',
                        horaInicio: '--:--',
                        minutosTotales: 0,
                        porcentaje: 0
                    }
                })
                .sort((a, b) => b.minutosTotales - a.minutosTotales)
        },
        
        tiempoPromedioOcupado() {
            if (this.cajonesOcupados.length === 0) return '0h 0m'
            
            const totalMinutos = this.cajonesOcupados.reduce((sum, spot) => sum + spot.minutosTotales, 0)
            const promedio = Math.floor(totalMinutos / this.cajonesOcupados.length)
            const horas = Math.floor(promedio / 60)
            const minutos = promedio % 60
            
            return `${horas}h ${minutos}m`
        },
        
        cajonMasTiempo() {
            if (this.cajonesOcupados.length === 0) {
                return { numero: 'N/A', tiempo: '0h 0m' }
            }
            
            const max = this.cajonesOcupados[0]
            return {
                numero: max.numero,
                tiempo: max.tiempoOcupado
            }
        },
        
        // ====================
        // PREDICCIÓN DE DISPONIBILIDAD
        // ====================
        prediccionHora() {
            if (!this.horaConsulta) {
                return { libres: 0, ocupados: 0, porcentaje: 0 }
            }
            
            // Si hay datos reales desde MySQL, usarlos
            if (this.prediccionData) {
                const total = this.prediccionData.libres + this.prediccionData.ocupados
                const porcentaje = total > 0 ? Math.round((this.prediccionData.libres / total) * 100) : 0
                
                return {
                    libres: this.prediccionData.libres,
                    ocupados: this.prediccionData.ocupados,
                    porcentaje: porcentaje
                }
            }
            
            // Si no hay datos (null o error), retornar 0s
            return { libres: 0, ocupados: 0, porcentaje: 0 }
        }
    },

    methods: {
        // ====================
        // AUTENTICACIÓN
        // ====================
        handleLogin() {
            this.loginError = ''
            
            if (!this.loginMatricula || !this.loginPassword) {
                this.loginError = 'Por favor completa todos los campos'
                return
            }
            
            // Verificar credenciales
            if (this.usuarios[this.loginMatricula] === this.loginPassword) {
                this.isLoggedIn = true
                this.currentUser = this.loginMatricula
                console.log('✅ Login exitoso:', this.currentUser)
                
                // Limpiar formulario
                this.loginMatricula = ''
                this.loginPassword = ''
            } else {
                this.loginError = '❌ Credenciales incorrectas'
                console.log('❌ Login fallido')
            }
        },
        
        handleLogout() {
            // Cancelar timer de reserva si existe
            if (this.userAlreadyHasReservation) {
                this.cancelReservationTimer(this.currentUser)
            }
            
            this.isLoggedIn = false
            this.currentUser = ''
            this.currentView = 'revisar'
            this.clearReservationSelection()
            console.log('👋 Logout exitoso')
        },
        
        clearReservationSelection() {
            this.selectedSpot = null
            this.minutosHastaLlegada = ''
            this.reservaHoraInicio = ''
            this.reservaHoraFin = ''
            this.reservaConfirmada = false
        },
        
        // ====================
        // NAVEGACIÓN
        // ====================
        selectView(view) {
            this.currentView = view
            console.log('Vista seleccionada:', view)
            
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send({
                    topic: 'view-changed',
                    payload: { view: view, timestamp: new Date().toISOString() }
                })
            }
        },
        
        // ====================
        // GESTIÓN DE ESTACIONAMIENTOS
        // ====================
        onParkingChange() {
            console.log('========================================')
            console.log('Cambio de estacionamiento:', this.selectedParkingId)
            console.log('Nombre:', this.parkingNames[this.selectedParkingId])
            
            // Cargar cajones del estacionamiento seleccionado desde parkingData
            if (this.parkingData[this.selectedParkingId]) {
                // Asignar REFERENCIA DIRECTA (no copia) para mantener sincronización
                this.currentSpots = this.parkingData[this.selectedParkingId]
                
                console.log('Cajones cargados desde parkingData persistente:')
                console.log('  - Total cajones:', this.currentSpots.length)
                console.log('  - Libres:', this.libresCount)
                console.log('  - Ocupados:', this.ocupadosCount)
                console.log('  - Reservados:', this.reservadosCount)
                console.log('========================================')
            }
            
            // Solicitar datos actualizados a Node-RED (si está disponible)
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send({
                    topic: 'get-parking-spots',
                    payload: { parkingId: this.selectedParkingId }
                })
            }
        },
        
        // ====================
        // ACTUALIZACIÓN DE ESTADOS CON TRACKING LOCAL
        // ====================
        updateSpotState(parkingId, spotId, nuevoEstado) {
            // Buscar el cajón en parkingData persistente
            if (!this.parkingData[parkingId]) return
            
            const spot = this.parkingData[parkingId].find(s => s.id === spotId)
            if (!spot) return
            
            const estadoAnterior = spot.estado
            spot.estado = nuevoEstado
            
            // Gestionar timestamp local para estadísticas
            if (nuevoEstado === 'ocupado' && estadoAnterior !== 'ocupado') {
                // Cajón recién ocupado: guardar timestamp LOCAL actual
                spot.ocupadoDesde = Date.now()
                spot.timestamp = Date.now()
                console.log(`✓ Cajón ${spot.numero} OCUPADO - iniciando conteo local`)
            } else if (nuevoEstado === 'reservado' && estadoAnterior !== 'reservado') {
                // Cajón recién reservado: guardar timestamp LOCAL actual
                spot.ocupadoDesde = Date.now()
                spot.timestamp = Date.now()
                console.log(`✓ Cajón ${spot.numero} RESERVADO - iniciando conteo local`)
            } else if (nuevoEstado === 'libre') {
                // Cajón liberado: resetear timestamps
                spot.ocupadoDesde = null
                spot.timestamp = null
                console.log(`✓ Cajón ${spot.numero} LIBERADO - reseteando conteo`)
            }
            
            console.log(`Cajón ${spot.numero} actualizado: ${estadoAnterior} → ${nuevoEstado}`)
        },
        
        updateSpotByNumber(parkingId, spotNumber, nuevoEstado) {
            if (!this.parkingData[parkingId]) return
            
            const spot = this.parkingData[parkingId].find(s => s.numero === spotNumber)
            if (!spot) return
            
            this.updateSpotState(parkingId, spot.id, nuevoEstado)
        },
        
        // ====================
        // RESERVAS
        // ====================
        selectSpotForReservation(spot) {
            if (spot.estado !== 'libre') return
            if (this.userAlreadyHasReservation) return
            
            this.selectedSpot = spot.numero
            this.reservaConfirmada = false
            console.log('Cajón seleccionado para reserva:', spot.numero)
        },
        
        // Calcular hora de inicio basado en minutos seleccionados
        calcularHoraInicioDesdeMinutos() {
            if (this.minutosHastaLlegada === '') {
                this.reservaHoraInicio = ''
                return
            }
            
            const now = new Date(this.currentTime)
            now.setMinutes(now.getMinutes() + parseInt(this.minutosHastaLlegada))
            
            const horas = String(now.getHours()).padStart(2, '0')
            const minutos = String(now.getMinutes()).padStart(2, '0')
            
            this.reservaHoraInicio = `${horas}:${minutos}`
        },
        
        calcularDuracion() {
            if (!this.reservaHoraInicio || !this.reservaHoraFin) return ''
            
            const [hi, mi] = this.reservaHoraInicio.split(':').map(Number)
            const [hf, mf] = this.reservaHoraFin.split(':').map(Number)
            
            let minutosInicio = hi * 60 + mi
            let minutosFin = hf * 60 + mf
            
            // Si minutosFin < minutosInicio, asumimos día siguiente
            if (minutosFin < minutosInicio) {
                minutosFin += 24 * 60
            }
            
            const diferencia = minutosFin - minutosInicio
            const horas = Math.floor(diferencia / 60)
            const mins = diferencia % 60
            
            if (horas === 0) return `${mins} minutos`
            if (mins === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
            return `${horas} ${horas === 1 ? 'hora' : 'horas'} y ${mins} minutos`
        },
        
        confirmarReserva() {
            if (!this.selectedSpot) return
            if (!this.minutosHastaLlegada || !this.reservaHoraFin) {
                alert('Por favor completa todos los campos')
                return
            }
            
            if (!this.isFormValid) {
                alert('La hora de salida debe ser al menos 15 minutos después de tu llegada')
                return
            }
            
            // Buscar el objeto spot completo
            const spot = this.currentSpots.find(s => s.numero === this.selectedSpot)
            if (!spot) return
            
            const ahora = new Date()
            const minutosLlegada = parseInt(this.minutosHastaLlegada)
            const horaInicio = new Date(ahora.getTime() + minutosLlegada * 60000)
            
            // Guardar reserva del usuario
            this.userReservations[this.currentUser] = this.selectedSpot
            
            // Cambiar estado del cajón a reservado
            this.updateSpotState(this.selectedParkingId, spot.id, 'reservado')
            
            // Programar expiración de reserva
            const [hFin, mFin] = this.reservaHoraFin.split(':').map(Number)
            const horaFin = new Date()
            horaFin.setHours(hFin, mFin, 0, 0)
            
            // Si la hora de fin es para mañana
            if (horaFin < ahora) {
                horaFin.setDate(horaFin.getDate() + 1)
            }
            
            const tiempoHastaFin = horaFin.getTime() - ahora.getTime()
            
            const timerId = setTimeout(() => {
                this.expirarReserva(this.currentUser)
            }, tiempoHastaFin)
            
            // Guardar información de la reserva
            this.userReservationSchedules[this.currentUser] = {
                horaInicio: this.reservaHoraInicio,
                horaFin: this.reservaHoraFin,
                parkingId: this.selectedParkingId,
                spotId: spot.id,
                spotNumber: spot.numero,
                cajon: spot.numero,
                timerId: timerId
            }
            
            this.reservaConfirmada = true
            
            console.log(`✓ Reserva confirmada:`)
            console.log(`  - Usuario: ${this.currentUser}`)
            console.log(`  - Cajón: ${this.selectedSpot}`)
            console.log(`  - Válida hasta: ${this.reservaHoraFin}`)
            
            // Enviar a Node-RED - SOLO el cambio de estado a reservado
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send({
                    topic: 'spot-status-change',
                    payload: {
                        parkingId: this.selectedParkingId,
                        spotId: spot.id,
                        spotNumber: spot.numero,
                        estado: 'reservado',
                        timestamp: Date.now()
                    }
                })
            }
            
            // Ocultar mensaje de confirmación y limpiar formulario después de 2 segundos
            setTimeout(() => {
                this.reservaConfirmada = false
                this.selectedSpot = null
                this.minutosHastaLlegada = ''
                this.reservaHoraInicio = ''
                this.reservaHoraFin = ''
            }, 2000)
        },
        
        cancelarReserva() {
            const cajon = this.userReservations[this.currentUser]
            if (!cajon) return
            
            const schedule = this.userReservationSchedules[this.currentUser]
            if (schedule) {
                // Cancelar timer de expiración
                clearTimeout(schedule.timerId)
                
                // Liberar cajón
                this.updateSpotByNumber(schedule.parkingId, cajon, 'libre')
                
                // Limpiar schedule
                delete this.userReservationSchedules[this.currentUser]
            }
            
            // Limpiar reserva del usuario
            delete this.userReservations[this.currentUser]
            
            this.reservaConfirmada = false
            this.selectedSpot = null
            this.minutosHastaLlegada = ''
            this.reservaHoraInicio = ''
            this.reservaHoraFin = ''
            
            console.log(`✓ Reserva cancelada: ${cajon}`)
            
            // Enviar a Node-RED - cambio de estado a 'libre'
            if (typeof uibuilder !== 'undefined') {
                if (schedule) {
                    uibuilder.send({
                        topic: 'spot-status-change',
                        payload: {
                            parkingId: schedule.parkingId,
                            spotId: schedule.spotId,
                            spotNumber: schedule.spotNumber,
                            estado: 'libre',
                            timestamp: Date.now()
                        }
                    })
                }
                
                // También enviar info adicional de cancelación
                uibuilder.send({
                    topic: 'reserva-cancelada',
                    payload: {
                        matricula: this.currentUser,
                        parkingId: schedule ? schedule.parkingId : null,
                        spotId: schedule ? schedule.spotId : null,
                        spotNumber: schedule ? schedule.spotNumber : null,
                        cajon: cajon,
                        timestamp: Date.now()
                    }
                })
            }
        },
        
        cancelReservationTimer(matricula) {
            const schedule = this.userReservationSchedules[matricula]
            if (schedule && schedule.timerId) {
                clearTimeout(schedule.timerId)
                delete this.userReservationSchedules[matricula]
            }
        },
        
        expirarReserva(matricula) {
            const cajon = this.userReservations[matricula]
            if (!cajon) return
            
            const schedule = this.userReservationSchedules[matricula]
            if (schedule) {
                // Liberar cajón
                this.updateSpotByNumber(schedule.parkingId, cajon, 'libre')
                
                // Limpiar schedule
                delete this.userReservationSchedules[matricula]
            }
            
            // Limpiar reserva
            delete this.userReservations[matricula]
            
            // NO activar reservaConfirmada cuando expira
            // (esto estaba causando que apareciera el mensaje verde al expirar)
            
            console.log(`⏰ Reserva expirada: ${cajon}`)
            
            // Enviar a Node-RED - cambio de estado a 'libre'
            if (typeof uibuilder !== 'undefined') {
                if (schedule) {
                    uibuilder.send({
                        topic: 'spot-status-change',
                        payload: {
                            parkingId: schedule.parkingId,
                            spotId: schedule.spotId,
                            spotNumber: schedule.spotNumber,
                            estado: 'libre',
                            timestamp: Date.now()
                        }
                    })
                }
                
                // También enviar info adicional de expiración
                uibuilder.send({
                    topic: 'reserva-expirada',
                    payload: {
                        matricula: matricula,
                        parkingId: schedule ? schedule.parkingId : null,
                        spotId: schedule ? schedule.spotId : null,
                        spotNumber: schedule ? schedule.spotNumber : null,
                        cajon: cajon,
                        timestamp: Date.now()
                    }
                })
            }
        },
        
        getUserReservationParkingName() {
            const schedule = this.userReservationSchedules[this.currentUser]
            if (!schedule) return ''
            return this.parkingNames[schedule.parkingId] || ''
        },
        
        getUserReservationHorario() {
            const schedule = this.userReservationSchedules[this.currentUser]
            if (!schedule) return ''
            // Retornar formato: "HH:MM - HH:MM"
            return `${schedule.horaInicio || '--:--'} - ${schedule.horaFin || '--:--'}`
        },
        
        getUserReservationDuracion() {
            const schedule = this.userReservationSchedules[this.currentUser]
            if (!schedule || !schedule.horaInicio || !schedule.horaFin) return ''
            
            const [hi, mi] = schedule.horaInicio.split(':').map(Number)
            const [hf, mf] = schedule.horaFin.split(':').map(Number)
            
            let minutosInicio = hi * 60 + mi
            let minutosFin = hf * 60 + mf
            
            // Si minutosFin < minutosInicio, asumimos día siguiente
            if (minutosFin < minutosInicio) {
                minutosFin += 24 * 60
            }
            
            const diferencia = minutosFin - minutosInicio
            const horas = Math.floor(diferencia / 60)
            const mins = diferencia % 60
            
            if (horas === 0) return `${mins} minutos`
            if (mins === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
            return `${horas} ${horas === 1 ? 'hora' : 'horas'} y ${mins} minutos`
        },
        
        getUserReservationTiempoRestante() {
            const schedule = this.userReservationSchedules[this.currentUser]
            if (!schedule || !schedule.horaInicio) return ''
            
            const ahora = new Date(this.currentTime)
            const [hi, mi] = schedule.horaInicio.split(':').map(Number)
            
            const horaLlegada = new Date()
            horaLlegada.setHours(hi, mi, 0, 0)
            
            // Si la hora de llegada ya pasó hoy, no mostrar nada (ya llegaste)
            if (horaLlegada <= ahora) {
                return 'Ya llegaste'
            }
            
            // Calcular diferencia en milisegundos
            const diferencia = horaLlegada - ahora
            const minutosTotales = Math.floor(diferencia / 60000)
            
            if (minutosTotales < 1) return 'Menos de 1 minuto'
            if (minutosTotales === 1) return '1 minuto'
            if (minutosTotales < 60) return `${minutosTotales} minutos`
            
            const horas = Math.floor(minutosTotales / 60)
            const mins = minutosTotales % 60
            
            if (mins === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
            return `${horas} ${horas === 1 ? 'hora' : 'horas'} y ${mins} minutos`
        },
        
        getDisponibilidadColorClass(porcentaje) {
            if (porcentaje >= 60) return 'disponibilidad-alta'
            if (porcentaje >= 30) return 'disponibilidad-media'
            return 'disponibilidad-baja'
        },
        
        // ====================
        // PREDICCIÓN DE DISPONIBILIDAD
        // ====================
        solicitarPrediccion() {
            if (!this.horaConsulta) {
                this.prediccionData = null
                this.prediccionError = ''
                return
            }
            
            // Parsear la hora seleccionada
            const [horas, minutos] = this.horaConsulta.split(':').map(Number)
            
            // Crear timestamp para la hora seleccionada (hoy)
            const fechaConsulta = new Date()
            fechaConsulta.setHours(horas, minutos, 0, 0)
            const timestampConsulta = fechaConsulta.getTime()
            
            console.log('Solicitando predicción:', {
                hora: this.horaConsulta,
                timestamp: timestampConsulta,
                parkingId: this.selectedParkingId
            })
            
            // Reiniciar estado
            this.prediccionData = null
            this.prediccionError = ''
            this.prediccionLoading = true
            
            // Guardar timestamp para usar al interpretar resultados
            this.timestampConsultaActual = timestampConsulta
            
            // Construir el query SQL aquí en el frontend
            const sqlQuery = `SELECT parkingId, spotId, spotNumber, estado, ttimestamp FROM EntradasSalidas WHERE parkingId = ${this.selectedParkingId} ORDER BY ttimestamp ASC`
            
            // Enviar a Node-RED con el query
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send({
                    topic: 'mysql-query',
                    payload: {
                        query: sqlQuery
                    }
                })
            } else {
                console.warn('uibuilder no disponible - no se puede solicitar predicción')
                this.prediccionLoading = false
                this.prediccionError = 'Sistema no conectado'
            }
        },
        
        // Interpretar resultados de MySQL y calcular predicción
        interpretarPrediccion(registros) {
            if (!registros || !Array.isArray(registros) || registros.length === 0) {
                this.prediccionLoading = false
                this.prediccionError = 'No existen datos para el tiempo solicitado'
                this.prediccionData = null
                console.log('Sin datos en MySQL para predicción')
                return
            }
            
            const timestampConsulta = this.timestampConsultaActual
            
            if (!timestampConsulta) {
                this.prediccionLoading = false
                this.prediccionError = 'Error al procesar solicitud'
                this.prediccionData = null
                return
            }
            
            // Crear objeto para almacenar el último estado conocido de cada cajón
            const estadosPorCajon = {}
            
            // Procesar cada registro en orden cronológico
            registros.forEach(registro => {
                // Solo considerar cambios que ocurrieron ANTES O EN el momento consultado
                if (registro.ttimestamp <= timestampConsulta) {
                    // Actualizar el estado del cajón con el más reciente
                    estadosPorCajon[registro.spotId] = {
                        estado: registro.estado,
                        spotNumber: registro.spotNumber,
                        timestamp: registro.ttimestamp
                    }
                }
            })
            
            // Contar cajones por estado
            let libres = 0
            let ocupados = 0
            
            Object.values(estadosPorCajon).forEach(cajon => {
                if (cajon.estado === 'libre') {
                    libres++
                } else if (cajon.estado === 'ocupado') {
                    ocupados++
                }
                // No contamos reservados en predicción histórica
            })
            
            // Si no hay datos interpretables, mostrar error
            if (libres === 0 && ocupados === 0) {
                this.prediccionLoading = false
                this.prediccionError = 'No existen datos para el tiempo solicitado'
                this.prediccionData = null
                console.log('No hay estados interpretables para el timestamp consultado')
                return
            }
            
            // Guardar resultados
            this.prediccionLoading = false
            this.prediccionError = ''
            this.prediccionData = {
                libres: libres,
                ocupados: ocupados
            }
            
            console.log('Predicción calculada:', {
                libres,
                ocupados,
                totalCajones: Object.keys(estadosPorCajon).length,
                timestamp: timestampConsulta
            })
        },
        
        // ====================
        // UTILIDADES
        // ====================
        updateClockPlaceholder() {
            const now = new Date()
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            const seconds = String(now.getSeconds()).padStart(2, '0')
            this.clockPlaceholder = `${hours}:${minutes}:${seconds}`
            this.currentTime = Date.now() // Actualizar para reactividad
        }
    },

    watch: {
        // Cuando el usuario cambia la hora de consulta, solicitar predicción automáticamente
        horaConsulta(newValue) {
            if (newValue) {
                this.solicitarPrediccion()
            }
        }
    },

    mounted() {
        console.log('========================================')
        console.log('CETYS Park - Sistema Iniciado')
        console.log('Versión con persistencia de estados')
        console.log('========================================')
        
        // Cargar cajones del estacionamiento Norte por defecto
        this.currentSpots = this.parkingData[this.selectedParkingId]
        
        console.log('Estado inicial:')
        console.log('  - Estacionamiento:', this.parkingNames[this.selectedParkingId])
        console.log('  - Total cajones:', this.currentSpots.length)
        console.log('  - Todos en estado: libre')
        console.log('========================================')
        
        // Iniciar reloj y actualizar currentTime cada segundo
        this.updateClockPlaceholder()
        setInterval(() => {
            this.updateClockPlaceholder()
        }, 1000)
        
        // Configurar listeners de Node-RED
        if (typeof uibuilder !== 'undefined') {
            console.log('uibuilder detectado - configurando listeners MQTT')
            
            uibuilder.onChange('msg', (msg) => {
                console.log('>> Mensaje MQTT >>', msg)
                
                // RELOJ
                if (msg.topic === 'clock' || msg.topic === 'time') {
                    if (msg.payload && typeof msg.payload === 'string') {
                        this.clockPlaceholder = msg.payload
                    } else if (msg.payload && msg.payload.time) {
                        this.clockPlaceholder = msg.payload.time
                    }
                }
                
                // CAMBIO DE ESTADO DE CAJÓN INDIVIDUAL (FORMATO STM32)
                // Formato esperado: { parkingId, spotId, spotNumber, estado, timestamp }
                else if (msg.topic === 'spot-status-change') {
                    if (msg.payload && msg.payload.parkingId && msg.payload.spotId && msg.payload.estado) {
                        console.log(`Cambio de estado recibido:`, {
                            parking: msg.payload.parkingId,
                            spotId: msg.payload.spotId,
                            spotNumber: msg.payload.spotNumber,
                            estado: msg.payload.estado,
                            timestamp: msg.payload.timestamp
                        })
                        
                        this.updateSpotState(
                            String(msg.payload.parkingId),
                            msg.payload.spotId,
                            msg.payload.estado
                        )
                    }
                }
                
                // ESTADOS COMPLETOS DE ESTACIONAMIENTO (si se reciben todos a la vez)
                else if (msg.topic === 'parking-spots') {
                    if (Array.isArray(msg.payload) && msg.payload.length > 0) {
                        console.log(`Recibidos ${msg.payload.length} cajones`)
                        msg.payload.forEach(spotData => {
                            if (spotData.parkingId && spotData.spotId && spotData.estado) {
                                this.updateSpotState(
                                    String(spotData.parkingId),
                                    spotData.spotId,
                                    spotData.estado
                                )
                            }
                        })
                    }
                }
                
                // RESPUESTA DE MYSQL CON DATOS HISTÓRICOS (para predicción)
                else if (msg.topic === 'mysql-response') {
                    console.log('Resultados de MySQL recibidos:', msg.payload)
                    
                    // Llamar al método que interpreta los datos
                    this.interpretarPrediccion(msg.payload)
                }
            })
        } else {
            console.log('uibuilder NO detectado - modo standalone')
        }
    },
    
    beforeUnmount() {
        // Limpiar timers de reservas
        Object.values(this.userReservationSchedules).forEach(schedule => {
            if (schedule.timerId) {
                clearTimeout(schedule.timerId)
            }
        })
    }
})

// Montar aplicación
try {
    app.mount('#app')
    console.log('✓ Aplicación Vue montada correctamente')
} catch (error) {
    console.error('✗ Error al montar aplicación:', error)
}