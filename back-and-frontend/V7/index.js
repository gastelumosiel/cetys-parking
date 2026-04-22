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
            
            // ========================================
            // ESTACIONAMIENTOS
            // ========================================
            selectedParkingId: '1',
            
            parkingNames: {
                '1': 'Estacionamiento Norte - Campus Principal',
                '2': 'Estacionamiento Sur - Edificio de Ingeniería'
            },
            
            // DUMMY DATA: Configuración inicial
            // NODE-RED TOPICS:
            // - 'parking-lots': Lista de estacionamientos disponibles
            //   PAYLOAD: [{ id: string, nombre: string }]
            // - 'parking-spots': Estado actual de cajones por estacionamiento
            //   PAYLOAD: [{ id: number, numero: string, estado: 'libre'|'ocupado'|'reservado', tiempoOcupado: number|null }]
            // - 'spot-status-change': Cambio individual de estado de cajón
            //   PAYLOAD: { parkingId: string, spotId: number, estado: string, timestamp: number }
            parkingData: {
                '1': [
                    { id: 1, numero: 'PS001', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 2.5) }, // 2.5 horas
                    { id: 2, numero: 'PS002', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 1.2) }, // 1.2 horas
                    { id: 3, numero: 'PS003', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 4.1) }, // 4.1 horas
                    { id: 4, numero: 'PS004', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 0.5) }, // 0.5 horas
                    { id: 5, numero: 'PS005', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 3.8) }, // 3.8 horas
                    { id: 6, numero: 'PS006', estado: 'libre', tiempoOcupado: null },
                    { id: 7, numero: 'PS007', estado: 'reservado', tiempoOcupado: Date.now() - (3600000 * 0.3) }, // 0.3 horas reservado
                    { id: 8, numero: 'PS008', estado: 'reservado', tiempoOcupado: Date.now() - (3600000 * 1.8) } // 1.8 horas reservado
                ],
                '2': [
                    { id: 1, numero: 'PS001', estado: 'libre', tiempoOcupado: null },
                    { id: 2, numero: 'PS002', estado: 'libre', tiempoOcupado: null },
                    { id: 3, numero: 'PS003', estado: 'libre', tiempoOcupado: null },
                    { id: 4, numero: 'PS004', estado: 'libre', tiempoOcupado: null },
                    { id: 5, numero: 'PS005', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 1.5) },
                    { id: 6, numero: 'PS006', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 2.0) },
                    { id: 7, numero: 'PS007', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 0.8) },
                    { id: 8, numero: 'PS008', estado: 'ocupado', tiempoOcupado: Date.now() - (3600000 * 3.2) }
                ]
            },
            
            currentSpots: [],
            
            // ========================================
            // RESERVAS
            // ========================================
            selectedSpot: null,
            minutosHastaLlegada: '',        // Minutos desde ahora (0-30)
            reservaHoraInicio: '',          // Se calcula automáticamente
            reservaHoraFin: '',
            reservaConfirmada: false,
            
            // Tracking de reservas por usuario (matrícula: número de cajón)
            // NODE-RED: Este objeto se sincronizará con la base de datos
            // TOPIC: 'user-reservations'
            // PAYLOAD: { matricula: string, cajon: string, timestamp: number }
            userReservations: {
                // '123456': 'PS007' // Ejemplo: usuario 123456 tiene reservado PS007
            },
            
            // Horarios de reserva por usuario (para expiración automática)
            // Formato: { matricula: { horaFin: 'HH:MM', parkingId: string, cajon: string, timerId: number } }
            userReservationSchedules: {
                // '123456': { horaFin: '14:30', parkingId: '1', cajon: 'PS007', timerId: 12345 }
            },
            
            // ========================================
            // ESTADÍSTICAS
            // ========================================
            horaConsulta: '',
            rotacionHoy: 0,
            currentTime: Date.now(), // Variable reactiva para forzar actualización de tiempos
            
            // Base de datos histórica simulada - 5 días de cambios de estado
            // NODE-RED TOPIC: 'historical-data'
            // PAYLOAD: { parkingId: string, spotNumber: string, estado: string, timestamp: number }
            // Esta estructura registra SOLO cuando hay cambios de estado, no cada hora
            historicalData: {
                '1': {
                    // Formato: hora -> { libres: X, ocupados: Y, basado en cambios reales }
                    '07:00': { libres: 6, ocupados: 2, cambiosRegistrados: 12 }, // Basado en 12 cambios de estado en esa hora a lo largo de 5 días
                    '08:00': { libres: 3, ocupados: 5, cambiosRegistrados: 18 },
                    '09:00': { libres: 1, ocupados: 7, cambiosRegistrados: 22 },
                    '10:00': { libres: 2, ocupados: 6, cambiosRegistrados: 20 },
                    '11:00': { libres: 1, ocupados: 7, cambiosRegistrados: 25 },
                    '12:00': { libres: 4, ocupados: 4, cambiosRegistrados: 15 },
                    '13:00': { libres: 5, ocupados: 3, cambiosRegistrados: 14 },
                    '14:00': { libres: 2, ocupados: 6, cambiosRegistrados: 19 },
                    '15:00': { libres: 3, ocupados: 5, cambiosRegistrados: 17 },
                    '16:00': { libres: 4, ocupados: 4, cambiosRegistrados: 16 },
                    '17:00': { libres: 6, ocupados: 2, cambiosRegistrados: 13 },
                    '18:00': { libres: 7, ocupados: 1, cambiosRegistrados: 8 },
                    '19:00': { libres: 8, ocupados: 0, cambiosRegistrados: 5 },
                    '20:00': { libres: 8, ocupados: 0, cambiosRegistrados: 2 },
                    '21:00': { libres: 8, ocupados: 0, cambiosRegistrados: 1 }
                },
                '2': {
                    '07:00': { libres: 7, ocupados: 1, cambiosRegistrados: 8 },
                    '08:00': { libres: 5, ocupados: 3, cambiosRegistrados: 14 },
                    '09:00': { libres: 3, ocupados: 5, cambiosRegistrados: 20 },
                    '10:00': { libres: 2, ocupados: 6, cambiosRegistrados: 23 },
                    '11:00': { libres: 1, ocupados: 7, cambiosRegistrados: 24 },
                    '12:00': { libres: 3, ocupados: 5, cambiosRegistrados: 18 },
                    '13:00': { libres: 6, ocupados: 2, cambiosRegistrados: 12 },
                    '14:00': { libres: 4, ocupados: 4, cambiosRegistrados: 16 },
                    '15:00': { libres: 3, ocupados: 5, cambiosRegistrados: 19 },
                    '16:00': { libres: 5, ocupados: 3, cambiosRegistrados: 15 },
                    '17:00': { libres: 7, ocupados: 1, cambiosRegistrados: 9 },
                    '18:00': { libres: 8, ocupados: 0, cambiosRegistrados: 6 },
                    '19:00': { libres: 8, ocupados: 0, cambiosRegistrados: 3 },
                    '20:00': { libres: 8, ocupados: 0, cambiosRegistrados: 1 },
                    '21:00': { libres: 8, ocupados: 0, cambiosRegistrados: 0 }
                }
            }
        }
    },

    computed: {
        // ========================================
        // COMPUTED: GENERAL
        // ========================================
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
        
        // Verificar si el usuario actual ya tiene una reserva activa
        userAlreadyHasReservation() {
            return this.userReservations.hasOwnProperty(this.currentUser)
        },
        
        // ========================================
        // COMPUTED: RESERVAS
        // ========================================
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
            
            const horaInicioDate = new Date()
            horaInicioDate.setHours(hi, mi, 0, 0)
            
            const horaFinDate = new Date()
            horaFinDate.setHours(hf, mf, 0, 0)
            
            const horaActualDate = new Date()
            horaActualDate.setHours(horaActual, minActual, 0, 0)
            
            // VALIDACIÓN: La hora fin NO puede estar en el intervalo prohibido
            // Intervalo prohibido = entre hora actual y hora de inicio
            // Ejemplo: si ahora son 4:10 y llegada es 4:20, no se puede poner fin entre 4:10 y 4:20
            const horaFinEnMinutos = hf * 60 + mf
            const horaInicioEnMinutos = hi * 60 + mi
            const horaActualEnMinutos = horaActual * 60 + minActual
            
            // Si la hora fin está entre la hora actual y la hora de inicio (mismo día), es inválido
            if (horaFinEnMinutos > horaActualEnMinutos && horaFinEnMinutos <= horaInicioEnMinutos) {
                return false
            }
            
            // Si hora fin es menor que inicio, asumimos día siguiente
            if (horaFinDate <= horaInicioDate) {
                horaFinDate.setDate(horaFinDate.getDate() + 1)
            }
            
            return horaFinDate > horaInicioDate
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
        
        // Hora actual en formato HH:MM para el atributo min
        horaActualStr() {
            // Usar currentTime para que se actualice cada segundo
            const now = new Date(this.currentTime)
            const horas = String(now.getHours()).padStart(2, '0')
            const minutos = String(now.getMinutes()).padStart(2, '0')
            return `${horas}:${minutos}`
        },
        
        // Detectar si la hora fin es del día siguiente (cruza medianoche)
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
            
            // Solo mostrar el mensaje cuando la hora fin es MENOR que la hora inicio
            // Esto indica que cruzamos medianoche (ej: inicio 23:30, fin 01:00)
            return finEnMinutos < inicioEnMinutos
        },
        
        // ========================================
        // COMPUTED: ESTADÍSTICAS
        // ========================================
        cajonesOcupados() {
            // Usar currentTime como dependencia para forzar recálculo cada segundo
            const ahora = this.currentTime
            return this.currentSpots
                .filter(spot => spot.estado === 'ocupado' && spot.tiempoOcupado)
                .map(spot => {
                    const diferencia = ahora - spot.tiempoOcupado
                    const horas = Math.floor(diferencia / 3600000)
                    const minutos = Math.floor((diferencia % 3600000) / 60000)
                    
                    // Calcular hora de inicio
                    const horaInicio = new Date(spot.tiempoOcupado)
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
                    if (spot.tiempoOcupado) {
                        const diferencia = ahora - spot.tiempoOcupado
                        const horas = Math.floor(diferencia / 3600000)
                        const minutos = Math.floor((diferencia % 3600000) / 60000)
                        
                        // Calcular hora de inicio
                        const horaInicio = new Date(spot.tiempoOcupado)
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
        
        prediccionHora() {
            if (!this.horaConsulta) {
                return { libres: 0, ocupados: 0, porcentaje: 0 }
            }
            
            // Redondear a la hora más cercana
            const [h] = this.horaConsulta.split(':').map(Number)
            const horaKey = `${String(h).padStart(2, '0')}:00`
            
            const data = this.historicalData[this.selectedParkingId]?.[horaKey]
            
            if (!data) {
                return { libres: 0, ocupados: 0, porcentaje: 0 }
            }
            
            const total = data.libres + data.ocupados
            const porcentaje = Math.round((data.libres / total) * 100)
            
            return {
                libres: data.libres,
                ocupados: data.ocupados,
                porcentaje: porcentaje
            }
        }
    },

    methods: {
        // ========================================
        // MÉTODOS: AUTENTICACIÓN
        // ========================================
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
        
        // Calcular hora de inicio basado en minutos seleccionados
        calcularHoraInicioDesdeMinutos() {
            if (this.minutosHastaLlegada === '') {
                this.reservaHoraInicio = ''
                return
            }
            
            const now = new Date(this.currentTime)  // Usar currentTime para reactividad
            now.setMinutes(now.getMinutes() + parseInt(this.minutosHastaLlegada))
            
            const horas = String(now.getHours()).padStart(2, '0')
            const minutos = String(now.getMinutes()).padStart(2, '0')
            
            this.reservaHoraInicio = `${horas}:${minutos}`
        },
        
        // ========================================
        // MÉTODOS: ESTACIONAMIENTOS
        // ========================================
        onParkingChange() {
            console.log('========================================')
            console.log('Estacionamiento seleccionado:', this.selectedParkingId)
            console.log('Nombre:', this.parkingNames[this.selectedParkingId])
            
            if (this.selectedParkingId && this.parkingData[this.selectedParkingId]) {
                this.currentSpots = JSON.parse(JSON.stringify(this.parkingData[this.selectedParkingId]))
                
                console.log('Cajones actualizados:')
                console.log('  - Total cajones:', this.currentSpots.length)
                console.log('  - Libres:', this.libresCount)
                console.log('  - Ocupados:', this.ocupadosCount)
                console.log('  - Reservados:', this.reservadosCount)
            }
            console.log('========================================')
        },
        
        updateClockPlaceholder() {
            const now = new Date()
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            const seconds = String(now.getSeconds()).padStart(2, '0')
            this.clockPlaceholder = `${hours}:${minutes}:${seconds}`
        },
        
        // ========================================
        // MÉTODOS: RESERVAS
        // ========================================
        selectSpotForReservation(spot) {
            if (spot.estado === 'libre') {
                // Verificar si el usuario ya tiene una reserva activa
                if (this.userAlreadyHasReservation && this.selectedSpot === null) {
                    console.log('⚠️ Usuario ya tiene una reserva activa')
                    return
                }
                
                // Si ya está seleccionado, deseleccionarlo
                if (this.selectedSpot === spot.numero) {
                    this.selectedSpot = null
                    this.reservaConfirmada = false
                    console.log('Cajón deseleccionado')
                } else {
                    this.selectedSpot = spot.numero
                    this.reservaConfirmada = false
                    console.log('Cajón seleccionado para reserva:', spot.numero)
                }
            } else {
                console.log('Cajón no disponible:', spot.numero, '- Estado:', spot.estado)
            }
        },
        
        confirmarReserva() {
            if (!this.isFormValid) return
            
            // Verificar nuevamente si el usuario ya tiene una reserva
            if (this.userAlreadyHasReservation) {
                console.log('⚠️ El usuario ya tiene una reserva activa')
                return
            }
            
            console.log('========================================')
            console.log('RESERVA CONFIRMADA')
            console.log('  - Usuario:', this.currentUser)
            console.log('  - Cajón:', this.selectedSpot)
            console.log('  - Estacionamiento:', this.selectedParkingName)
            console.log('  - Minutos hasta llegada:', this.minutosHastaLlegada, 'min')
            console.log('  - Hora inicio (calculada):', this.reservaHoraInicio)
            console.log('  - Hora fin:', this.reservaHoraFin)
            console.log('  - Duración total:', this.calcularDuracion())
            console.log('========================================')
            
            // Actualizar estado del cajón a "reservado" con timestamp
            const spot = this.currentSpots.find(s => s.numero === this.selectedSpot)
            if (spot) {
                spot.estado = 'reservado'
                spot.tiempoOcupado = Date.now() // Guardar el momento de la reserva
                
                // También actualizar en parkingData para persistencia durante la sesión
                const parkingSpot = this.parkingData[this.selectedParkingId].find(s => s.numero === this.selectedSpot)
                if (parkingSpot) {
                    parkingSpot.estado = 'reservado'
                    parkingSpot.tiempoOcupado = Date.now()
                }
                
                // 🚀 ENVIAR ESTADO A NODE-RED/STM32
                this.sendSpotStatusToNodeRED(
                    this.selectedParkingId,
                    spot.id,
                    spot.numero,
                    'reservado'
                )
                
                // Registrar la reserva del usuario
                this.userReservations[this.currentUser] = this.selectedSpot
                
                // Guardar el horario de la reserva
                this.userReservationSchedules[this.currentUser] = {
                    horaFin: this.reservaHoraFin,
                    parkingId: this.selectedParkingId,
                    cajon: this.selectedSpot,
                    timerId: null // Se asignará en scheduleReservationExpiration
                }
                
                // Programar expiración automática con setTimeout
                this.scheduleReservationExpiration(this.currentUser, this.reservaHoraFin)
            }
            
            // Mostrar confirmación
            this.reservaConfirmada = true
            
            // Limpiar formulario después de 3 segundos
            setTimeout(() => {
                this.selectedSpot = null
                this.minutosHastaLlegada = ''
                this.reservaHoraInicio = ''
                this.reservaHoraFin = ''
                this.reservaConfirmada = false
            }, 3000)
        },
        
        cancelarReserva() {
            this.selectedSpot = null
            this.reservaHoraInicio = ''
            this.reservaHoraFin = ''
            this.reservaConfirmada = false
            console.log('Reserva cancelada')
        },
        
        calcularDuracion() {
            if (!this.reservaHoraFin) return '0h 0m'
            
            // Calcular duración desde AHORA hasta hora fin
            const now = new Date()
            const [hf, mf] = this.reservaHoraFin.split(':').map(Number)
            
            const horaFinDate = new Date()
            horaFinDate.setHours(hf, mf, 0, 0)
            
            // Si hora fin es menor que ahora, asumimos que es del día siguiente
            if (horaFinDate <= now) {
                horaFinDate.setDate(horaFinDate.getDate() + 1)
            }
            
            // Calcular diferencia en minutos
            let minutosTotales = Math.floor((horaFinDate - now) / (1000 * 60))
            
            const horas = Math.floor(minutosTotales / 60)
            const minutos = minutosTotales % 60
            
            return `${horas}h ${minutos}m`
        },
        
        formatDate(dateStr) {
            if (!dateStr) return ''
            const date = new Date(dateStr)
            return date.toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
        },
        
        // Determinar clase de color según porcentaje de disponibilidad
        getDisponibilidadColorClass(porcentaje) {
            if (porcentaje >= 75) return 'disponibilidad-alta'      // Verde (>= 75%)
            if (porcentaje >= 50) return 'disponibilidad-media'     // Amarillo (50-74%)
            if (porcentaje >= 25) return 'disponibilidad-baja'      // Naranja (25-49%)
            return 'disponibilidad-critica'                         // Rojo (< 25%)
        },
        
        // Obtener nombre del estacionamiento donde el usuario tiene reserva
        getUserReservationParkingName() {
            if (!this.userAlreadyHasReservation) return ''
            
            const schedule = this.userReservationSchedules[this.currentUser]
            if (schedule && schedule.parkingId) {
                return this.parkingNames[schedule.parkingId] || 'Desconocido'
            }
            
            // Buscar en todos los estacionamientos
            for (const parkingId in this.parkingData) {
                const spots = this.parkingData[parkingId]
                const reservedSpot = spots.find(s => 
                    s.numero === this.userReservations[this.currentUser] && 
                    s.estado === 'reservado'
                )
                if (reservedSpot) {
                    return this.parkingNames[parkingId] || 'Desconocido'
                }
            }
            
            return 'Desconocido'
        },
        
        // Expirar una reserva específica
        expireReservation(matricula) {
            const schedule = this.userReservationSchedules[matricula]
            if (!schedule) return
            
            console.log(`⏰ Reserva expirada para usuario ${matricula} - Cajón ${schedule.cajon}`)
            
            const parkingId = schedule.parkingId
            const cajon = schedule.cajon
            
            // Buscar el cajón en parkingData para obtener el spotId
            const spot = this.parkingData[parkingId].find(s => s.numero === cajon)
            if (spot) {
                spot.estado = 'libre'
                spot.tiempoOcupado = null
                
                // 🚀 ENVIAR ESTADO 'LIBRE' A NODE-RED/STM32
                this.sendSpotStatusToNodeRED(
                    parkingId,
                    spot.id,
                    spot.numero,
                    'libre'
                )
            }
            
            // Actualizar currentSpots si es el estacionamiento actual
            if (this.selectedParkingId === parkingId) {
                const currentSpot = this.currentSpots.find(s => s.numero === cajon)
                if (currentSpot) {
                    currentSpot.estado = 'libre'
                    currentSpot.tiempoOcupado = null
                }
            }
            
            // Eliminar la reserva del usuario
            delete this.userReservations[matricula]
            delete this.userReservationSchedules[matricula]
        },
        
        // Programar expiración automática de una reserva
        scheduleReservationExpiration(matricula, horaFin) {
            const now = new Date()
            const [endHour, endMinute] = horaFin.split(':').map(Number)
            
            // Crear fecha de expiración
            const expirationTime = new Date()
            expirationTime.setHours(endHour)
            expirationTime.setMinutes(endMinute)
            expirationTime.setSeconds(0)
            expirationTime.setMilliseconds(0)
            
            // Si la hora de expiración ya pasó (por ejemplo, es del día siguiente), agregar 1 día
            if (expirationTime <= now) {
                expirationTime.setDate(expirationTime.getDate() + 1)
            }
            
            // Calcular milisegundos hasta la expiración
            const msUntilExpiration = expirationTime.getTime() - now.getTime()
            
            console.log(`⏱️ Reserva programada para expirar en ${Math.round(msUntilExpiration / 1000)} segundos (${horaFin})`)
            
            // Programar expiración con setTimeout
            const timerId = setTimeout(() => {
                this.expireReservation(matricula)
            }, msUntilExpiration)
            
            // Guardar el timerId para poder cancelarlo si es necesario
            if (this.userReservationSchedules[matricula]) {
                this.userReservationSchedules[matricula].timerId = timerId
            }
            
            return timerId
        },
        
        // Cancelar timer de expiración (útil para logout o cancelación manual)
        cancelReservationTimer(matricula) {
            const schedule = this.userReservationSchedules[matricula]
            if (schedule && schedule.timerId) {
                clearTimeout(schedule.timerId)
                console.log(`🚫 Timer de expiración cancelado para usuario ${matricula}`)
            }
        },
        
        // Enviar estado de cajón a Node-RED/STM32 (solo para reservas)
        sendSpotStatusToNodeRED(parkingId, spotId, spotNumber, estado) {
            const msg = {
                topic: 'spot-status-change',
                payload: {
                    parkingId: parkingId,
                    spotId: spotId,
                    spotNumber: spotNumber,
                    estado: estado,
                    timestamp: Date.now()  // Usar el tiempo actual del sistema
                }
            }
            
            console.log('📤 Enviando estado a Node-RED/STM32:', msg)
            
            // Enviar a Node-RED solo si uibuilder está disponible
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send(msg)
                console.log('✅ Mensaje enviado a Node-RED')
            } else {
                console.warn('⚠️ uibuilder no disponible - mensaje no enviado')
                console.log('📋 Mensaje que se enviaría:', JSON.stringify(msg, null, 2))
            }
            
            return msg
        }
    },

    watch: {
        // Limpiar selección de reserva al cambiar de vista
        currentView(newView) {
            if (newView !== 'reservar') {
                this.clearReservationSelection()
            }
        },
        
        // Recalcular hora de inicio cada segundo si hay minutos seleccionados
        currentTime() {
            if (this.minutosHastaLlegada !== '') {
                this.calcularHoraInicioDesdeMinutos()
            }
        }
    },

    mounted() {
        console.log('========================================')
        console.log('CETYS Park - Sistema Iniciado')
        console.log('========================================')
        console.log('CREDENCIALES DE PRUEBA:')
        console.log('  - Matrícula: 123456, Password: pass123')
        console.log('  - Matrícula: 654321, Password: pass456')
        console.log('  - Matrícula: admin, Password: admin')
        console.log('========================================')
        
        // Cargar datos del estacionamiento Norte por defecto
        this.currentSpots = JSON.parse(JSON.stringify(this.parkingData[this.selectedParkingId]))
        
        // Simular rotación del día
        this.rotacionHoy = Math.floor(Math.random() * 20) + 10
        
        // Iniciar reloj
        this.updateClockPlaceholder()
        setInterval(() => {
            this.updateClockPlaceholder()
        }, 1000)
        
        // Actualizar currentTime cada segundo para que se recalculen los tiempos reactivamente
        setInterval(() => {
            this.currentTime = Date.now()
        }, 1000)
        
        // ========================================
        // LISTENER DE UIBUILDER
        // ========================================
        if (typeof uibuilder !== 'undefined') {
            console.log('✅ uibuilder detectado - configurando listeners')
            
            uibuilder.onChange('msg', (msg) => {
                console.log('📩 Mensaje recibido de Node-RED:', msg)
                
                // CAMBIO INDIVIDUAL DE ESTADO
                if (msg.topic === 'spot-status-change') {
                    console.log('🎯 Procesando cambio de estado:', msg.payload)
                    
                    const { parkingId, spotId, spotNumber, estado, timestamp } = msg.payload
                    
                    console.log(`  parkingId: ${parkingId}`)
                    console.log(`  spotId: ${spotId}`)
                    console.log(`  spotNumber: ${spotNumber}`)
                    console.log(`  estado: ${estado}`)
                    
                    // Actualizar en parkingData (base de datos local)
                    if (this.parkingData[parkingId]) {
                        const spot = this.parkingData[parkingId].find(s => s.id === spotId)
                        if (spot) {
                            spot.estado = estado
                            spot.tiempoOcupado = estado !== 'libre' ? (timestamp || Date.now()) : null
                            console.log(`✅ parkingData actualizado: ${spot.numero} → ${estado}`)
                        } else {
                            console.warn(`⚠️ No se encontró spotId ${spotId} en parkingData[${parkingId}]`)
                        }
                    } else {
                        console.warn(`⚠️ No existe parkingId: ${parkingId}`)
                    }
                    
                    // Si es el estacionamiento actual, actualizar currentSpots (vista activa)
                    if (this.selectedParkingId === parkingId) {
                        const currentSpot = this.currentSpots.find(s => s.id === spotId)
                        if (currentSpot) {
                            currentSpot.estado = estado
                            currentSpot.tiempoOcupado = estado !== 'libre' ? (timestamp || Date.now()) : null
                            console.log(`✅ currentSpots actualizado: ${currentSpot.numero} → ${estado}`)
                            console.log('🎨 La vista debería actualizarse automáticamente (Vue reactivo)')
                        } else {
                            console.warn(`⚠️ No se encontró spotId ${spotId} en currentSpots`)
                        }
                    } else {
                        console.log(`ℹ️ Estacionamiento ${parkingId} no está seleccionado actualmente (selected: ${this.selectedParkingId})`)
                    }
                }
                
                // LISTA DE ESTACIONAMIENTOS DESDE MYSQL/MQTT
                else if (msg.topic === 'parking-lots') {
                    if (Array.isArray(msg.payload) && msg.payload.length > 0) {
                        this.parkingNames = {}
                        msg.payload.forEach(parking => {
                            this.parkingNames[String(parking.id)] = parking.nombre
                        })
                        console.log('🅿️ Estacionamientos cargados:', msg.payload.length)
                    }
                }
                
                // SINCRONIZACION COMPLETA DE ESTACIONAMIENTO
                else if (msg.topic === 'parking-spots') {
                    console.log('🔄 Sincronización completa de estacionamiento')
                    if (msg.payload.parkingId && Array.isArray(msg.payload.spots)) {
                        const parkingId = msg.payload.parkingId
                        this.parkingData[parkingId] = msg.payload.spots.map(spot => ({
                            id: spot.id,
                            numero: spot.numero || `PS${String(spot.id).padStart(3, '0')}`,
                            estado: spot.estado,
                            tiempoOcupado: spot.tiempoOcupado || null
                        }))
                        
                        if (this.selectedParkingId === parkingId) {
                            this.currentSpots = JSON.parse(JSON.stringify(this.parkingData[parkingId]))
                        }
                        
                        console.log(`✅ Estacionamiento ${parkingId} sincronizado:`, this.parkingData[parkingId].length, 'cajones')
                    }
                }
                
                else {
                    console.log('ℹ️ Topic no reconocido:', msg.topic)
                }
            })
            
            console.log('✅ Listener de uibuilder configurado')
        } else {
            console.log('⚠️ uibuilder NO detectado - modo standalone')
        }
        
        console.log('✅ Sistema listo')
        console.log('========================================')
    }
})

// Montar la aplicación
try {
    app.mount('#app')
    console.log('✅ Aplicación Vue montada correctamente en #app')
} catch (error) {
    console.error('❌ Error al montar la aplicación Vue:', error)
}