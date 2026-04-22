// @ts-nocheck
'use strict'

// Verificar si Vue está disponible
if (typeof Vue === 'undefined') {
    console.error('Vue no está cargado. Verifica que vue.global.prod.js esté disponible.')
}

const { createApp } = Vue

const app = createApp({
    data() { 
        return {
            // UI State
            currentView: 'revisar',
            
            // Real-time clock placeholder
            clockPlaceholder: '00:00:00',
            
            // Parking lot seleccionado (inicia con Norte)
            selectedParkingId: '1',
            
            // DUMMY DATA: Nombres de estacionamientos
            parkingNames: {
                '1': 'Estacionamiento Norte - Campus Principal',
                '2': 'Estacionamiento Sur - Edificio de Ingeniería'
            },
            
            // DUMMY DATA: Configuración de cajones por estacionamiento
            // ESTACIONAMIENTO NORTE: PS001-PS005 ocupados (5), PS006 libre (1), PS007-PS008 reservados (2)
            // ESTACIONAMIENTO SUR: PS001-PS004 libres (4), PS005-PS008 ocupados (4), 0 reservados
            parkingData: {
                '1': [
                    { id: 1, numero: 'PS001', estado: 'ocupado' },
                    { id: 2, numero: 'PS002', estado: 'ocupado' },
                    { id: 3, numero: 'PS003', estado: 'ocupado' },
                    { id: 4, numero: 'PS004', estado: 'ocupado' },
                    { id: 5, numero: 'PS005', estado: 'ocupado' },
                    { id: 6, numero: 'PS006', estado: 'libre' },
                    { id: 7, numero: 'PS007', estado: 'reservado' },
                    { id: 8, numero: 'PS008', estado: 'reservado' }
                ],
                '2': [
                    { id: 1, numero: 'PS001', estado: 'libre' },
                    { id: 2, numero: 'PS002', estado: 'libre' },
                    { id: 3, numero: 'PS003', estado: 'libre' },
                    { id: 4, numero: 'PS004', estado: 'libre' },
                    { id: 5, numero: 'PS005', estado: 'ocupado' },
                    { id: 6, numero: 'PS006', estado: 'ocupado' },
                    { id: 7, numero: 'PS007', estado: 'ocupado' },
                    { id: 8, numero: 'PS008', estado: 'ocupado' }
                ]
            },
            
            // Cajones actuales mostrados
            currentSpots: []
        }
    },

    computed: {
        // Nombre del estacionamiento seleccionado
        selectedParkingName() {
            return this.parkingNames[this.selectedParkingId] || 'Estacionamiento'
        },
        
        // Contar libres en el estacionamiento actual
        libresCount() {
            return this.currentSpots.filter(spot => spot.estado === 'libre').length
        },
        
        // Contar ocupados en el estacionamiento actual
        ocupadosCount() {
            return this.currentSpots.filter(spot => spot.estado === 'ocupado').length
        },
        
        // Contar reservados en el estacionamiento actual
        reservadosCount() {
            return this.currentSpots.filter(spot => spot.estado === 'reservado').length
        }
    },

    methods: {
        // Seleccionar vista del menú
        selectView(view) {
            this.currentView = view
            console.log('Vista seleccionada:', view)
            
            // Enviar a Node-RED solo si uibuilder está disponible
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send({
                    topic: 'view-changed',
                    payload: {
                        view: view,
                        timestamp: new Date().toISOString()
                    }
                })
            }
        },
        
        // Cambiar estacionamiento seleccionado
        onParkingChange() {
            console.log('========================================')
            console.log('Estacionamiento seleccionado:', this.selectedParkingId)
            console.log('Nombre:', this.parkingNames[this.selectedParkingId])
            
            // Actualizar cajones según el estacionamiento seleccionado
            if (this.selectedParkingId && this.parkingData[this.selectedParkingId]) {
                // Hacer copia profunda de los datos
                this.currentSpots = JSON.parse(JSON.stringify(this.parkingData[this.selectedParkingId]))
                
                console.log('Cajones actualizados:')
                console.log('  - Total cajones:', this.currentSpots.length)
                console.log('  - Libres:', this.libresCount)
                console.log('  - Ocupados:', this.ocupadosCount)
                console.log('  - Reservados:', this.reservadosCount)
                console.log('========================================')
            }
            
            // Enviar a Node-RED solo si uibuilder está disponible
            if (typeof uibuilder !== 'undefined') {
                uibuilder.send({
                    topic: 'get-parking-spots',
                    payload: {
                        parkingId: this.selectedParkingId
                    }
                })
            }
        },
        
        // Actualizar reloj placeholder
        updateClockPlaceholder() {
            const now = new Date()
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            const seconds = String(now.getSeconds()).padStart(2, '0')
            this.clockPlaceholder = `${hours}:${minutes}:${seconds}`
        },
        
        // Actualizar cajón por ID
        updateSpotById(spotId, estado) {
            const spot = this.currentSpots.find(s => s.id === spotId)
            if (spot) {
                spot.estado = estado
                console.log(`Cajón ID ${spotId} actualizado a: ${estado}`)
            }
        },
        
        // Actualizar cajón por número
        updateSpotByNumber(spotNumber, estado) {
            const spot = this.currentSpots.find(s => s.numero === spotNumber)
            if (spot) {
                spot.estado = estado
                console.log(`Cajón ${spotNumber} actualizado a: ${estado}`)
            }
        }
    },

    mounted() {
        console.log('========================================')
        console.log('CETYS Park - Sistema Iniciado')
        console.log('========================================')
        console.log('DUMMY DATA cargada:')
        console.log('')
        console.log('Estacionamiento Norte:')
        console.log('  - PS001 a PS005: OCUPADOS (5)')
        console.log('  - PS006: LIBRE (1)')
        console.log('  - PS007 a PS008: RESERVADOS (2)')
        console.log('')
        console.log('Estacionamiento Sur:')
        console.log('  - PS001 a PS004: LIBRES (4)')
        console.log('  - PS005 a PS008: OCUPADOS (4)')
        console.log('  - Reservados: 0')
        console.log('========================================')
        
        // Cargar datos del estacionamiento Norte por defecto
        this.currentSpots = JSON.parse(JSON.stringify(this.parkingData[this.selectedParkingId]))
        
        console.log('Estado inicial (Vue mounted):')
        console.log('  - Estacionamiento:', this.parkingNames[this.selectedParkingId])
        console.log('  - currentSpots.length:', this.currentSpots.length)
        console.log('  - Libres:', this.libresCount)
        console.log('  - Ocupados:', this.ocupadosCount)
        console.log('  - Reservados:', this.reservadosCount)
        console.log('  - Cajones:', this.currentSpots)
        console.log('========================================')
        
        // Iniciar reloj
        this.updateClockPlaceholder()
        setInterval(() => {
            this.updateClockPlaceholder()
        }, 1000)
        
        // Configurar listener de Node-RED solo si uibuilder está disponible
        if (typeof uibuilder !== 'undefined') {
            console.log('uibuilder detectado - configurando listeners MQTT')
            
            uibuilder.onChange('msg', (msg) => {
                console.log('>> Mensaje de Node-RED >>', msg)
                
                // ACTUALIZACIÓN DE RELOJ DESDE MQTT
                if (msg.topic === 'clock' || msg.topic === 'time') {
                    if (msg.payload && typeof msg.payload === 'string') {
                        this.clockPlaceholder = msg.payload
                        console.log('Reloj actualizado desde MQTT:', msg.payload)
                    } else if (msg.payload && msg.payload.time) {
                        this.clockPlaceholder = msg.payload.time
                        console.log('Reloj actualizado desde MQTT:', msg.payload.time)
                    }
                }
                
                // LISTA DE ESTACIONAMIENTOS DESDE MYSQL/MQTT
                else if (msg.topic === 'parking-lots') {
                    if (Array.isArray(msg.payload) && msg.payload.length > 0) {
                        this.parkingNames = {}
                        msg.payload.forEach(parking => {
                            this.parkingNames[String(parking.id)] = parking.nombre
                        })
                        console.log('Estacionamientos cargados desde MQTT:', msg.payload.length)
                    }
                }
                
                // ESTADOS DE CAJONES DEL ESTACIONAMIENTO
                else if (msg.topic === 'parking-spots') {
                    if (Array.isArray(msg.payload)) {
                        this.currentSpots = msg.payload.map(spot => ({
                            id: spot.id,
                            numero: spot.numero || `PS${String(spot.id).padStart(3, '0')}`,
                            estado: spot.estado
                        }))
                        console.log('Cajones actualizados desde MQTT:', this.currentSpots.length)
                    }
                }
                
                // ACTUALIZACIÓN INDIVIDUAL DE UN CAJÓN
                else if (msg.topic === 'spot-status-update') {
                    if (msg.payload) {
                        if (msg.payload.spotId && msg.payload.estado) {
                            this.updateSpotById(msg.payload.spotId, msg.payload.estado)
                        } else if (msg.payload.spotNumber && msg.payload.estado) {
                            this.updateSpotByNumber(msg.payload.spotNumber, msg.payload.estado)
                        }
                    }
                }
                
                // ACTUALIZACIÓN MASIVA DE TODOS LOS CAJONES
                else if (msg.topic === 'update-all-spots') {
                    if (Array.isArray(msg.payload)) {
                        msg.payload.forEach((update, index) => {
                            if (index < this.currentSpots.length && update.estado) {
                                this.currentSpots[index].estado = update.estado
                            }
                        })
                        console.log('Todos los cajones actualizados desde MQTT')
                    }
                }
            })
        } else {
            console.log('uibuilder NO detectado - modo standalone con DUMMY DATA')
        }
    }
})

// Montar la aplicación
try {
    app.mount('#app')
    console.log('✓ Aplicación Vue montada correctamente en #app')
} catch (error) {
    console.error('✗ Error al montar la aplicación Vue:', error)
}