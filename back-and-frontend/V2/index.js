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
            reservaHoraInicio: '',
            reservaHoraFin: '',
            reservaConfirmada: false,
            
            // ========================================
            // ESTADÍSTICAS
            // ========================================
            horaConsulta: '',
            rotacionHoy: 0,
            currentTime: Date.now(), // Variable reactiva para forzar actualización de tiempos
            
            // Datos históricos simulados para predicciones
            historicalData: {
                '1': {
                    '07:00': { libres: 6, ocupados: 2 },
                    '08:00': { libres: 3, ocupados: 5 },
                    '09:00': { libres: 1, ocupados: 7 },
                    '10:00': { libres: 2, ocupados: 6 },
                    '11:00': { libres: 1, ocupados: 7 },
                    '12:00': { libres: 4, ocupados: 4 },
                    '13:00': { libres: 5, ocupados: 3 },
                    '14:00': { libres: 2, ocupados: 6 },
                    '15:00': { libres: 3, ocupados: 5 },
                    '16:00': { libres: 4, ocupados: 4 },
                    '17:00': { libres: 6, ocupados: 2 },
                    '18:00': { libres: 7, ocupados: 1 }
                },
                '2': {
                    '07:00': { libres: 7, ocupados: 1 },
                    '08:00': { libres: 5, ocupados: 3 },
                    '09:00': { libres: 3, ocupados: 5 },
                    '10:00': { libres: 2, ocupados: 6 },
                    '11:00': { libres: 1, ocupados: 7 },
                    '12:00': { libres: 3, ocupados: 5 },
                    '13:00': { libres: 6, ocupados: 2 },
                    '14:00': { libres: 4, ocupados: 4 },
                    '15:00': { libres: 3, ocupados: 5 },
                    '16:00': { libres: 5, ocupados: 3 },
                    '17:00': { libres: 7, ocupados: 1 },
                    '18:00': { libres: 8, ocupados: 0 }
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
        
        // ========================================
        // COMPUTED: RESERVAS
        // ========================================
        isFormValid() {
            if (!this.reservaHoraInicio || !this.reservaHoraFin) return false
            
            const [hi, mi] = this.reservaHoraInicio.split(':').map(Number)
            const [hf, mf] = this.reservaHoraFin.split(':').map(Number)
            const inicio = hi * 60 + mi
            const fin = hf * 60 + mf
            
            return fin > inicio
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
                    
                    return {
                        numero: spot.numero,
                        tiempoOcupado: `${horas}h ${minutos}m`,
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
                        
                        return {
                            numero: spot.numero,
                            tiempoReservado: `${horas}h ${minutos}m`,
                            minutosTotales: Math.floor(diferencia / 60000),
                            porcentaje: Math.min((diferencia / (6 * 3600000)) * 100, 100)
                        }
                    }
                    return {
                        numero: spot.numero,
                        tiempoReservado: '0h 0m',
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
                return { libres: 0, ocupados: 0, porcentaje: 0, cajonesLibres: [] }
            }
            
            // Redondear a la hora más cercana
            const [h] = this.horaConsulta.split(':').map(Number)
            const horaKey = `${String(h).padStart(2, '0')}:00`
            
            const data = this.historicalData[this.selectedParkingId]?.[horaKey]
            
            if (!data) {
                return { libres: 0, ocupados: 0, porcentaje: 0, cajonesLibres: [] }
            }
            
            const total = data.libres + data.ocupados
            const porcentaje = Math.round((data.libres / total) * 100)
            
            // Determinar qué cajones suelen estar libres a esa hora (simulado)
            const cajonesLibres = []
            for (let i = 0; i < data.libres && i < this.currentSpots.length; i++) {
                cajonesLibres.push(this.currentSpots[i].numero)
            }
            
            return {
                libres: data.libres,
                ocupados: data.ocupados,
                porcentaje: porcentaje,
                cajonesLibres: cajonesLibres
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
            this.isLoggedIn = false
            this.currentUser = ''
            this.currentView = 'revisar'
            this.clearReservationSelection()
            console.log('👋 Logout exitoso')
        },
        
        clearReservationSelection() {
            this.selectedSpot = null
            this.reservaHoraInicio = ''
            this.reservaHoraFin = ''
            this.reservaConfirmada = false
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
            
            console.log('========================================')
            console.log('RESERVA CONFIRMADA')
            console.log('  - Usuario:', this.currentUser)
            console.log('  - Cajón:', this.selectedSpot)
            console.log('  - Estacionamiento:', this.selectedParkingName)
            console.log('  - Horario:', this.reservaHoraInicio, '-', this.reservaHoraFin)
            console.log('  - Duración:', this.calcularDuracion())
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
            }
            
            // Mostrar confirmación
            this.reservaConfirmada = true
            
            // Limpiar formulario después de 3 segundos
            setTimeout(() => {
                this.selectedSpot = null
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
            if (!this.reservaHoraInicio || !this.reservaHoraFin) return '0h 0m'
            
            const [hi, mi] = this.reservaHoraInicio.split(':').map(Number)
            const [hf, mf] = this.reservaHoraFin.split(':').map(Number)
            
            let minutos = (hf * 60 + mf) - (hi * 60 + mi)
            
            const horas = Math.floor(minutos / 60)
            minutos = minutos % 60
            
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
        }
    },

    watch: {
        // Limpiar selección de reserva al cambiar de vista
        currentView(newView) {
            if (newView !== 'reservar') {
                this.clearReservationSelection()
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