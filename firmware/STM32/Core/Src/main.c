/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "string.h"
#include "mbedtls.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "mongoose_glue.h"
#include "sh1106.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */
typedef struct {
	uint16_t pin;
	GPIO_TypeDef *port;
} IO;
/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
#define LIBRE 0  //LED Verde
#define OCUPADO 1 //LED Rojo
#define RESERVADO 2 //LED Azul

#define LEDON 1
#define LEDOFF 0

#define XCOORD 30
#define YCOORD 10
#define YOFFSET 20
#define XOFFSET 25
/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
#if defined ( __ICCARM__ ) /*!< IAR Compiler */
#pragma location=0x2007c000
ETH_DMADescTypeDef  DMARxDscrTab[ETH_RX_DESC_CNT]; /* Ethernet Rx DMA Descriptors */
#pragma location=0x2007c0a0
ETH_DMADescTypeDef  DMATxDscrTab[ETH_TX_DESC_CNT]; /* Ethernet Tx DMA Descriptors */

#elif defined ( __CC_ARM )  /* MDK ARM Compiler */

__attribute__((at(0x2007c000))) ETH_DMADescTypeDef  DMARxDscrTab[ETH_RX_DESC_CNT]; /* Ethernet Rx DMA Descriptors */
__attribute__((at(0x2007c0a0))) ETH_DMADescTypeDef  DMATxDscrTab[ETH_TX_DESC_CNT]; /* Ethernet Tx DMA Descriptors */

#elif defined ( __GNUC__ ) /* GNU Compiler */

ETH_DMADescTypeDef DMARxDscrTab[ETH_RX_DESC_CNT] __attribute__((section(".RxDecripSection"))); /* Ethernet Rx DMA Descriptors */
ETH_DMADescTypeDef DMATxDscrTab[ETH_TX_DESC_CNT] __attribute__((section(".TxDecripSection")));   /* Ethernet Tx DMA Descriptors */
#endif

ETH_TxPacketConfig TxConfig;

ETH_HandleTypeDef heth;

RNG_HandleTypeDef hrng;

RTC_HandleTypeDef hrtc;

SPI_HandleTypeDef hspi1;

TIM_HandleTypeDef htim1;
TIM_HandleTypeDef htim2;
TIM_HandleTypeDef htim9;

UART_HandleTypeDef huart3;

/* USER CODE BEGIN PV */
char mystr[150];
int rxflag = 0;
char outer_delimiter[] = ",";
char inner_delimiter[] = ": \"\n";
char *token;
char* outer_saveptr = NULL;
char* inner_saveptr = NULL;
char *parkingId;
char *spotId;
char *spotNumber;
char *estadonuevo;
char *mitimestamp;

int num_espacios = 0;
char mensajito[500];

int servin;

//LEDs y sensores para espacios activos
IO leds_verdes[] = {{VER1_1_Pin,VER1_1_GPIO_Port},
					{VER1_2_Pin,VER1_2_GPIO_Port},
					{VER1_3_Pin,VER1_3_GPIO_Port},
					{VER1_4_Pin,VER1_4_GPIO_Port},
					{VER1_5_Pin,VER1_5_GPIO_Port},
					{VER1_6_Pin,VER1_6_GPIO_Port},
					{VER1_7_Pin,VER1_7_GPIO_Port},
					{VER1_8_Pin,VER1_8_GPIO_Port}};
IO leds_rojos[] = {{ROJ1_1_Pin,ROJ1_1_GPIO_Port},
				   {ROJ1_2_Pin,ROJ1_2_GPIO_Port},
				   {ROJ1_3_Pin,ROJ1_3_GPIO_Port},
				   {ROJ1_4_Pin,ROJ1_4_GPIO_Port},
				   {ROJ1_5_Pin,ROJ1_5_GPIO_Port},
				   {ROJ1_6_Pin,ROJ1_6_GPIO_Port},
				   {ROJ1_7_Pin,ROJ1_7_GPIO_Port},
				   {ROJ1_8_Pin,ROJ1_8_GPIO_Port}};
IO leds_azules[] = {{AZU1_1_Pin,AZU1_1_GPIO_Port},
  		 		    {AZU1_2_Pin,AZU1_2_GPIO_Port},
   		  		    {AZU1_3_Pin,AZU1_3_GPIO_Port},
  	  		  	    {AZU1_4_Pin,AZU1_4_GPIO_Port},
  	  		  	    {AZU1_5_Pin,AZU1_5_GPIO_Port},
  	  		  	    {AZU1_6_Pin,AZU1_6_GPIO_Port},
  	  		  	    {AZU1_7_Pin,AZU1_7_GPIO_Port},
  	 		 	    {AZU1_8_Pin,AZU1_8_GPIO_Port}};
IO entradas[] = {{IN1_Pin,IN1_GPIO_Port},
				 {IN2_Pin,IN2_GPIO_Port},
				 {IN3_Pin,IN3_GPIO_Port},
				 {IN4_Pin,IN4_GPIO_Port},
				 {IN5_Pin,IN5_GPIO_Port},
				 {IN6_Pin,IN6_GPIO_Port},
				 {IN7_Pin,IN7_GPIO_Port},
				 {IN8_Pin,IN8_GPIO_Port}};

//LEDs para espacios pasivos
IO leds_azules2[] = {{AZU2_1_Pin,AZU2_1_GPIO_Port},
					 {AZU2_2_Pin,AZU2_2_GPIO_Port},
					 {AZU2_3_Pin,AZU2_3_GPIO_Port},
					 {AZU2_4_Pin,AZU2_4_GPIO_Port},
					 {AZU2_5_Pin,AZU2_5_GPIO_Port},
					 {AZU2_6_Pin,AZU2_6_GPIO_Port},
					 {AZU2_7_Pin,AZU2_7_GPIO_Port},
					 {AZU2_8_Pin,AZU2_8_GPIO_Port}};
IO leds_verdes2[] = {{VER2_1_Pin,VER2_1_GPIO_Port},
				     {VER2_2_Pin,VER2_2_GPIO_Port},
				     {VER2_3_Pin,VER2_3_GPIO_Port},
				     {VER2_4_Pin,VER2_4_GPIO_Port},
				     {VER2_5_Pin,VER2_5_GPIO_Port},
				     {VER2_6_Pin,VER2_6_GPIO_Port},
				     {VER2_7_Pin,VER2_7_GPIO_Port},
				     {VER2_8_Pin,VER2_8_GPIO_Port}};

char ids[8][20] = {"PS001","PS002","PS003","PS004","PS005","PS006","PS007","PS008"};

char estados[2][10] = {"libre","ocupado"};

/*
 * Del 0 al 7: espacios activos con sensores
 * Del 8 al 15: espacios pasivos
 * */
int espacios[16] = {LIBRE, LIBRE, LIBRE, LIBRE,
					LIBRE, LIBRE, LIBRE, LIBRE,
					LIBRE, LIBRE, LIBRE, LIBRE,
					LIBRE, LIBRE, LIBRE, LIBRE};

int onoff = 0;
int contadorentrada = 3001;
int contadorsalida = 3001;

static const Font_TypeDef Font7x10 = {
	7,           // Font width
	10,          // Font height
	10,          // Bytes per character
	FONT_H,      // Horizontal font scan lines
	32,          // First character: space
	126,         // Last character: '~'
	126,         // Unknown character: '~'
	{
		0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, //   (20)
		0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x00,0x18,0x18, // ! (21)
		0x36,0x36,0x36,0x36,0x00,0x00,0x00,0x00,0x00,0x00, // " (22)
		0x00,0x36,0x36,0x7F,0x7F,0x36,0x7F,0x7F,0x36,0x36, // # (23)
		0x08,0x3E,0x6B,0x0B,0x0E,0x38,0x68,0x6B,0x3E,0x08, // $ (24)
		0x67,0x65,0x37,0x18,0x18,0x0C,0x0C,0x76,0x53,0x73, // % (25)
		0x00,0x00,0x00,0x1E,0x33,0x33,0x1E,0x73,0x33,0x7E, // & (26)
		0x18,0x18,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00, // ' (27)
		0x30,0x18,0x0C,0x0C,0x06,0x06,0x0C,0x0C,0x18,0x30, // ( (28)
		0x06,0x0C,0x18,0x18,0x30,0x30,0x18,0x18,0x0C,0x06, // ) (29)
		0x00,0x00,0x08,0x08,0x7F,0x1C,0x1C,0x36,0x22,0x00, // * (2A)
		0x00,0x00,0x18,0x18,0x7E,0x7E,0x18,0x18,0x00,0x00, // + (2B)
		0x00,0x00,0x00,0x00,0x00,0x3C,0x38,0x38,0x18,0x0C, // , (2C)
		0x00,0x00,0x00,0x00,0x7F,0x7F,0x00,0x00,0x00,0x00, // - (2D)
		0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x18,0x3C,0x18, // . (2E)
		0x40,0x60,0x60,0x30,0x18,0x0C,0x06,0x03,0x03,0x01, // / (2F)
		0x1C,0x36,0x63,0x63,0x63,0x63,0x63,0x63,0x36,0x1C, // 0 (30)
		0x18,0x1C,0x1E,0x18,0x18,0x18,0x18,0x18,0x18,0x7E, // 1 (31)
		0x3E,0x63,0x63,0x60,0x30,0x18,0x0C,0x06,0x03,0x7F, // 2 (32)
		0x7F,0x60,0x30,0x18,0x3C,0x60,0x60,0x60,0x63,0x3E, // 3 (33)
		0x30,0x38,0x3C,0x36,0x33,0x33,0x7F,0x30,0x30,0x30, // 4 (34)
		0x7F,0x03,0x03,0x3F,0x67,0x60,0x60,0x60,0x63,0x3E, // 5 (35)
		0x3C,0x06,0x03,0x03,0x3F,0x67,0x63,0x63,0x67,0x3E, // 6 (36)
		0x7F,0x60,0x60,0x30,0x18,0x18,0x0C,0x0C,0x0C,0x0C, // 7 (37)
		0x3E,0x63,0x63,0x63,0x3E,0x63,0x63,0x63,0x63,0x3E, // 8 (38)
		0x3E,0x73,0x63,0x63,0x73,0x7E,0x60,0x60,0x30,0x1E, // 9 (39)
		0x00,0x1C,0x1C,0x1C,0x00,0x00,0x1C,0x1C,0x1C,0x00, // : (3A)
		0x00,0x18,0x3C,0x18,0x00,0x3C,0x38,0x38,0x18,0x0C, // ; (3B)
		0x00,0x60,0x30,0x18,0x0C,0x06,0x0C,0x18,0x30,0x60, // < (3C)
		0x00,0x00,0x00,0x00,0x7E,0x00,0x00,0x7E,0x00,0x00, // = (3D)
		0x00,0x06,0x0C,0x18,0x30,0x60,0x30,0x18,0x0C,0x06, // > (3E)
		0x3E,0x63,0x63,0x60,0x30,0x18,0x18,0x00,0x18,0x18, // ? (3F)
		0x00,0x3E,0x7F,0x73,0x7B,0x4B,0x4B,0x7B,0x07,0x7E, // @ (40)
		0x1C,0x3E,0x63,0x63,0x63,0x7F,0x63,0x63,0x63,0x63, // A (41)
		0x3F,0x66,0x66,0x66,0x3E,0x66,0x66,0x66,0x66,0x3F, // B (42)
		0x3E,0x67,0x63,0x03,0x03,0x03,0x03,0x63,0x67,0x3E, // C (43)
		0x3F,0x66,0x66,0x66,0x66,0x66,0x66,0x66,0x66,0x3F, // D (44)
		0x7F,0x03,0x03,0x03,0x1F,0x03,0x03,0x03,0x03,0x7F, // E (45)
		0x7F,0x03,0x03,0x03,0x1F,0x03,0x03,0x03,0x03,0x03, // F (46)
		0x3E,0x63,0x63,0x03,0x03,0x03,0x73,0x63,0x63,0x3E, // G (47)
		0x63,0x63,0x63,0x63,0x7F,0x63,0x63,0x63,0x63,0x63, // H (48)
		0x3C,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x3C, // I (49)
		0x70,0x60,0x60,0x60,0x60,0x60,0x60,0x63,0x63,0x3E, // J (4A)
		0x63,0x63,0x33,0x1B,0x0F,0x0F,0x1B,0x33,0x63,0x63, // K (4B)
		0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x43,0x7F, // L (4C)
		0x63,0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0x63,0x63, // M (4D)
		0x63,0x63,0x67,0x67,0x6F,0x7B,0x73,0x73,0x63,0x63, // N (4E)
		0x3E,0x63,0x63,0x63,0x63,0x63,0x63,0x63,0x63,0x3E, // O (4F)
		0x3F,0x63,0x63,0x63,0x63,0x3F,0x03,0x03,0x03,0x03, // P (50)
		0x3E,0x63,0x63,0x63,0x63,0x63,0x63,0x7B,0x3E,0x60, // Q (51)
		0x3F,0x63,0x63,0x63,0x3F,0x1F,0x33,0x33,0x63,0x63, // R (52)
		0x3E,0x63,0x63,0x03,0x3E,0x60,0x60,0x63,0x63,0x3E, // S (53)
		0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18, // T (54)
		0x63,0x63,0x63,0x63,0x63,0x63,0x63,0x63,0x63,0x3E, // U (55)
		0x63,0x63,0x63,0x63,0x22,0x36,0x36,0x1C,0x1C,0x08, // V (56)
		0x63,0x63,0x63,0x63,0x63,0x63,0x6B,0x6B,0x7F,0x36, // W (57)
		0x63,0x63,0x36,0x36,0x1C,0x1C,0x36,0x36,0x63,0x63, // X (58)
		0x66,0x66,0x66,0x3C,0x3C,0x18,0x18,0x18,0x18,0x18, // Y (59)
		0x7F,0x60,0x60,0x30,0x18,0x0C,0x06,0x03,0x03,0x7F, // Z (5A)
		0x3E,0x06,0x06,0x06,0x06,0x06,0x06,0x06,0x06,0x3E, // [ (5B)
		0x01,0x03,0x03,0x06,0x0C,0x18,0x30,0x60,0x60,0x40, // \ (5C)
		0x3E,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x3E, // ] (5D)
		0x08,0x1C,0x36,0x63,0x00,0x00,0x00,0x00,0x00,0x00, // ^ (5E)
		0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x7F, // _ (5F)
		0x0C,0x18,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00, // ` (60)
		0x00,0x00,0x00,0x3E,0x60,0x7E,0x63,0x63,0x73,0x6E, // a (61)
		0x03,0x03,0x03,0x3B,0x67,0x63,0x63,0x63,0x67,0x3B, // b (62)
		0x00,0x00,0x00,0x3E,0x67,0x03,0x03,0x03,0x67,0x3E, // c (63)
		0x60,0x60,0x60,0x6E,0x73,0x63,0x63,0x63,0x73,0x6E, // d (64)
		0x00,0x00,0x00,0x3E,0x63,0x63,0x7F,0x03,0x63,0x3E, // e (65)
		0x3C,0x66,0x06,0x06,0x06,0x3F,0x06,0x06,0x06,0x06, // f (66)
		0x00,0x00,0x00,0x7E,0x33,0x1E,0x0F,0x3E,0x63,0x3E, // g (67)
		0x03,0x03,0x03,0x3B,0x67,0x63,0x63,0x63,0x63,0x63, // h (68)
		0x00,0x18,0x18,0x00,0x1C,0x18,0x18,0x18,0x18,0x3C, // i (69)
		0x00,0x60,0x60,0x00,0x70,0x60,0x60,0x63,0x63,0x3E, // j (6A)
		0x03,0x03,0x03,0x33,0x1B,0x0F,0x0F,0x1B,0x33,0x63, // k (6B)
		0x1C,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x3C, // l (6C)
		0x00,0x00,0x00,0x36,0x7F,0x6B,0x6B,0x63,0x63,0x63, // m (6D)
		0x00,0x00,0x00,0x3B,0x67,0x63,0x63,0x63,0x63,0x63, // n (6E)
		0x00,0x00,0x00,0x3E,0x63,0x63,0x63,0x63,0x63,0x3E, // o (6F)
		0x00,0x00,0x00,0x3B,0x67,0x63,0x67,0x3B,0x03,0x03, // p (70)
		0x00,0x00,0x00,0x6E,0x73,0x63,0x73,0x6E,0x60,0x60, // q (71)
		0x00,0x00,0x00,0x3B,0x67,0x03,0x03,0x03,0x03,0x03, // r (72)
		0x00,0x00,0x00,0x3E,0x63,0x06,0x1C,0x30,0x63,0x3E, // s (73)
		0x06,0x06,0x06,0x06,0x3F,0x06,0x06,0x06,0x66,0x3C, // t (74)
		0x00,0x00,0x00,0x63,0x63,0x63,0x63,0x63,0x73,0x6E, // u (75)
		0x00,0x00,0x00,0x63,0x63,0x63,0x63,0x36,0x36,0x1C, // v (76)
		0x00,0x00,0x00,0x63,0x63,0x63,0x6B,0x6B,0x7F,0x36, // w (77)
		0x00,0x00,0x00,0x63,0x63,0x36,0x1C,0x36,0x63,0x63, // x (78)
		0x00,0x00,0x00,0x63,0x63,0x73,0x6E,0x60,0x63,0x3E, // y (79)
		0x00,0x00,0x00,0x7F,0x30,0x18,0x0C,0x06,0x03,0x7F, // z (7A)
		0x00,0x78,0x0C,0x0C,0x18,0x0E,0x18,0x0C,0x0C,0x78, // { (7B)
		0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18, // | (7C)
		0x00,0x1E,0x30,0x30,0x18,0x70,0x18,0x30,0x30,0x1E, // } (7D)
		0x00,0x4E,0x7F,0x39,0x00,0x00,0x00,0x00,0x00,0x00  // ~ (7E)
	}
};
float slope = 0.97;
float yint = 38;


int64_t timepos = 0;

int servoenterdefault = 38;
int servoenterup = 86;
int servoexitdefault = 86;
int servoexitup = 38;
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_ETH_Init(void);
static void MX_RNG_Init(void);
static void MX_USART3_UART_Init(void);
static void MX_TIM2_Init(void);
static void MX_SPI1_Init(void);
static void MX_TIM1_Init(void);
static void MX_RTC_Init(void);
static void MX_TIM9_Init(void);
/* USER CODE BEGIN PFP */
//Espacios activos
void espacio_ocupado(int num);
void espacio_libre(int num);
void espacio_reservado(int num);

//Espacios pasivos
void espacio_pasivo(int num);
void preparar_msg(int id, int estado);
void decodificar_msg();

void updateTime();
void abrirPluma(TIM_TypeDef * timer, int inout);
/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
int _gettimeofday(struct timeval *tv, void *tzvp) {
	RTC_DateTypeDef date;
	RTC_TimeTypeDef time;

	// Get the current date and time from the RTC
	HAL_RTC_GetTime(&hrtc, &time, RTC_FORMAT_BIN);
	HAL_RTC_GetDate(&hrtc, &date, RTC_FORMAT_BIN);

	// Convert to UNIX timestamp (seconds since 1970)
	struct tm t = {0};
	t.tm_year = date.Year + 100; // Years since 1900
	t.tm_mon = date.Month - 1; // Months are 0-11
	t.tm_mday = date.Date;
	t.tm_hour = time.Hours;
	t.tm_min = time.Minutes;
	t.tm_sec = time.Seconds;

	tv->tv_sec = mktime(&t); // Convert to seconds
	tv->tv_usec = 0; // Microseconds (not supported here)

	return 0; // Return 0 for success
}

bool mg_random(void *buf, size_t len) {  // Use on-board RNG
  for (size_t n = 0; n < len; n += sizeof(uint32_t)) {
    uint32_t r;
    HAL_RNG_GenerateRandomNumber(&hrng, &r);
    memcpy((char *) buf + n, &r, n + sizeof(r) > len ? len - n : sizeof(r));
  }
  return true;
}

int _write(int fd, unsigned char *buf, int len) {
  if (fd == 1 || fd == 2) {                     // stdout or stderr ?
    HAL_UART_Transmit(&huart3, buf, len, 999);  // Print to the UART
  }
  return len;
}

uint64_t mg_millis(void) {
  return HAL_GetTick();
}

#define TLS_CA \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFBjCCAu6gAwIBAgIRAMISMktwqbSRcdxA9+KFJjwwDQYJKoZIhvcNAQELBQAw\n" \
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n" \
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw\n" \
"WhcNMjcwMzEyMjM1OTU5WjAzMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg\n" \
"RW5jcnlwdDEMMAoGA1UEAxMDUjEyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\n" \
"CgKCAQEA2pgodK2+lP474B7i5Ut1qywSf+2nAzJ+Npfs6DGPpRONC5kuHs0BUT1M\n" \
"5ShuCVUxqqUiXXL0LQfCTUA83wEjuXg39RplMjTmhnGdBO+ECFu9AhqZ66YBAJpz\n" \
"kG2Pogeg0JfT2kVhgTU9FPnEwF9q3AuWGrCf4yrqvSrWmMebcas7dA8827JgvlpL\n" \
"Thjp2ypzXIlhZZ7+7Tymy05v5J75AEaz/xlNKmOzjmbGGIVwx1Blbzt05UiDDwhY\n" \
"XS0jnV6j/ujbAKHS9OMZTfLuevYnnuXNnC2i8n+cF63vEzc50bTILEHWhsDp7CH4\n" \
"WRt/uTp8n1wBnWIEwii9Cq08yhDsGwIDAQABo4H4MIH1MA4GA1UdDwEB/wQEAwIB\n" \
"hjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwEgYDVR0TAQH/BAgwBgEB\n" \
"/wIBADAdBgNVHQ4EFgQUALUp8i2ObzHom0yteD763OkM0dIwHwYDVR0jBBgwFoAU\n" \
"ebRZ5nu25eQBc4AIiMgaWPbpm24wMgYIKwYBBQUHAQEEJjAkMCIGCCsGAQUFBzAC\n" \
"hhZodHRwOi8veDEuaS5sZW5jci5vcmcvMBMGA1UdIAQMMAowCAYGZ4EMAQIBMCcG\n" \
"A1UdHwQgMB4wHKAaoBiGFmh0dHA6Ly94MS5jLmxlbmNyLm9yZy8wDQYJKoZIhvcN\n" \
"AQELBQADggIBAI910AnPanZIZTKS3rVEyIV29BWEjAK/duuz8eL5boSoVpHhkkv3\n" \
"4eoAeEiPdZLj5EZ7G2ArIK+gzhTlRQ1q4FKGpPPaFBSpqV/xbUb5UlAXQOnkHn3m\n" \
"FVj+qYv87/WeY+Bm4sN3Ox8BhyaU7UAQ3LeZ7N1X01xxQe4wIAAE3JVLUCiHmZL+\n" \
"qoCUtgYIFPgcg350QMUIWgxPXNGEncT921ne7nluI02V8pLUmClqXOsCwULw+PVO\n" \
"ZCB7qOMxxMBoCUeL2Ll4oMpOSr5pJCpLN3tRA2s6P1KLs9TSrVhOk+7LX28NMUlI\n" \
"usQ/nxLJID0RhAeFtPjyOCOscQBA53+NRjSCak7P4A5jX7ppmkcJECL+S0i3kXVU\n" \
"y5Me5BbrU8973jZNv/ax6+ZK6TM8jWmimL6of6OrX7ZU6E2WqazzsFrLG3o2kySb\n" \
"zlhSgJ81Cl4tv3SbYiYXnJExKQvzf83DYotox3f0fwv7xln1A2ZLplCb0O+l/AK0\n" \
"YE0DS2FPxSAHi0iwMfW2nNHJrXcY3LLHD77gRgje4Eveubi2xxa+Nmk/hmhLdIET\n" \
"iVDFanoCrMVIpQ59XWHkzdFmoHXHBV7oibVjGSO7ULSQ7MJ1Nz51phuDJSgAIU7A\n" \
"0zrLnOrAj/dfrlEWRhCvAgbuwLZX1A2sjNjXoPOHbsPiy+lO1KF8/XY7\n" \
"-----END CERTIFICATE-----"
#define TX_TOPIC "device1/tx"
#define RX_TOPIC "device1/rx"

// Called when we connected to the MQTT server
void my_mqtt_on_connect(struct mg_connection *c, int code) {
  struct mg_mqtt_opts opts;
  memset(&opts, 0, sizeof(opts));
  opts.qos = 1;
  opts.topic = mg_str(RX_TOPIC);  // Subscribe to the RX topic
  mg_mqtt_sub(c, &opts);
  MG_DEBUG(("%lu code %d. Subscribing to [%.*s]", c->id, code, opts.topic.len,
            opts.topic.buf));
}

// This function gets called for every received MQTT message
void my_mqtt_on_message(struct mg_connection *c, struct mg_str topic,
                          struct mg_str data) {
  printf("\n%s\n\r",data.buf);
  strcpy(mystr, data.buf);
  rxflag = 1;
}

void my_mqtt_sendmessage(char *mensaje)
{
	if (g_mqtt_conn != NULL)
	{
	    struct mg_mqtt_opts opts;        // Publish MQTT response
	    memset(&opts, 0, sizeof(opts));  // to the TX topic
	    opts.topic = mg_str(TX_TOPIC);
	    opts.message = mg_str(mensaje);
	    mg_mqtt_pub(g_mqtt_conn, &opts);
	}
}

// This function is called on every control MQTT message
void my_mqtt_on_cmd(struct mg_connection *c, struct mg_mqtt_message *mm) {
  MG_DEBUG(("%lu cmd %d qos %d", c->id, mm->cmd, mm->qos));
}

// This function creates MQTT server connection
struct mg_connection *my_mqtt_connect(mg_event_handler_t fn) {
  const char *url = WIZARD_MQTT_URL;
  struct mg_connection *c;
  struct mg_mqtt_opts opts;
  memset(&opts, 0, sizeof(opts));
  opts.clean = true;
  struct mg_str usuario;
  usuario.buf = "Usuario";
  usuario.len = strlen(usuario.buf);
  struct mg_str contrasena;
  contrasena.buf = "Admin123";
  contrasena.len = strlen(contrasena.buf);
  struct mg_str iden;
  iden.buf = "STM32_cliente";
  iden.len = strlen(iden.buf);
  opts.user = usuario;
  opts.pass = contrasena;
  opts.client_id = iden;
  opts.keepalive = 6000;
  if ((c = mg_mqtt_connect(&g_mgr, url, &opts, fn, NULL)) != NULL) {
    MG_DEBUG(("%lu TLS enabled: %s", c->id, c->is_tls ? "yes" : "no"));
    if (c->is_tls) {
      struct mg_tls_opts tls_opts;
      memset(&tls_opts, 0, sizeof(tls_opts));
      tls_opts.ca = mg_str(TLS_CA);
      tls_opts.name = mg_url_host(url);
      mg_tls_init(c, &tls_opts);
    }
  }
  return c;
}

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_ETH_Init();
  MX_RNG_Init();
  MX_USART3_UART_Init();
  MX_MBEDTLS_Init();
  MX_TIM2_Init();
  MX_SPI1_Init();
  MX_TIM1_Init();
  MX_RTC_Init();
  MX_TIM9_Init();
  /* USER CODE BEGIN 2 */
  HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_2);
  HAL_TIM_PWM_Start(&htim9, TIM_CHANNEL_2);
  int servo_signal = 38;
  HAL_TIM_Base_Start_IT(&htim2);
  mongoose_init();

  SH1106_Init();
  SH1106_Flush();
  SH1106_SetXDir(LCD_INVERT_ON);
  SH1106_SetYDir(LCD_INVERT_ON);

  GPIO_PinState lecturas[8];
  GPIO_PinState lect_prev[8];
  int espacios_temp = 0;
  int espacios_lib = 0;
  int espacios_camb = 0;

  char display[20];

  struct mongoose_mqtt_handlers mqtt_handlers = {
	  my_mqtt_connect, my_mqtt_on_connect,
	  my_mqtt_on_message, my_mqtt_on_cmd,
  };
  mongoose_set_mqtt_handlers(&mqtt_handlers);

  SH1106_Fill(0);
  LCD_PutStr(XCOORD,YCOORD,"Espacios:",&Font7x10);
  sprintf(display, "%d", 8);
  LCD_PutStr(XCOORD+XOFFSET,YCOORD+YOFFSET,display,&Font7x10);
  SH1106_Flush();
  servo_signal = (int) (0*slope+yint);
  TIM1->CCR2 = servo_signal;
  int flag2 = 1;
  int flag1 = 0;

  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
	  if((mg_now()>170000000) && flag2)
	  {
		  flag2 = 0;
		  updateTime();
	  }
	  mongoose_poll();
	  if(flag1 == 2)
	  {
		  if(rxflag)
			  decodificar_msg();
		  espacios_temp = 0;

		  //Espacios activos
		  for(int i=0; i<8; i++)
		  {
			  if(espacios[i] != RESERVADO)
			  {
				  lecturas[i] = HAL_GPIO_ReadPin(entradas[i].port,entradas[i].pin);
				  if(lecturas[i] == GPIO_PIN_SET)
				  {
					  espacio_ocupado(i);
					  espacios[i] = OCUPADO;
					  espacios_temp++;
				  }
				  else
				  {
					  espacio_libre(i);
					  espacios[i] = LIBRE;
				  }
				  if (lecturas[i] != lect_prev[i])
				  {
					  preparar_msg(i, espacios[i]);
					  my_mqtt_sendmessage(mensajito);
				  }
				  lect_prev[i] = lecturas[i];
			  }
			  else
			  {
				  espacio_reservado(i);
			  }
		  }
		  //Espacios pasivos
		  for(int i = 8; i<16; i++)
		  {
			  espacio_pasivo(i);
			  if(espacios[i] == RESERVADO)
			  {
				  espacios_temp++;
			  }
		  }

		  num_espacios = espacios_temp;
		  espacios_lib = 16 - num_espacios;
		  if(espacios_lib != espacios_camb)
		  {
			  SH1106_Fill(0);
			  LCD_PutStr(XCOORD,YCOORD,"Espacios:",&Font7x10);
			  sprintf(display, "%d", espacios_lib);
			  LCD_PutStr(XCOORD+XOFFSET,YCOORD+YOFFSET,display,&Font7x10);
			  SH1106_Flush();
		  }
		  espacios_camb = espacios_lib;
		  if((HAL_GPIO_ReadPin(INENTER_GPIO_Port, INENTER_Pin) == GPIO_PIN_SET) && espacios_lib > 0)
		  {
			  abrirPluma(TIM9, 1);
		  }
		  if(HAL_GPIO_ReadPin(INEXIT_GPIO_Port, INEXIT_Pin) == GPIO_PIN_SET)
		  {
			  abrirPluma(TIM1, 0);
		  }
		  HAL_GPIO_WritePin(LEDRED_GPIO_Port, LEDRED_Pin,GPIO_PIN_RESET);
	  }
	  else if(flag1 == 1)
	  {
		  for(int i=0; i<16; i++)
		  {
			  preparar_msg(i, espacios[i]);
			  my_mqtt_sendmessage(mensajito);
		  }
		  flag1 = 2;
	  }
	  else
	  {
		  HAL_GPIO_WritePin(LEDRED_GPIO_Port, LEDRED_Pin,GPIO_PIN_SET);
		  flag1 = (HAL_GPIO_ReadPin(COMENZAR_GPIO_Port, COMENZAR_Pin) == GPIO_PIN_SET);
		  for(int i=0; i<16; i++)
		  {
			  if(i<8)
			  {
				  HAL_GPIO_WritePin(leds_azules[i].port, leds_azules[i].pin, GPIO_PIN_SET);
			  }
			  else
			  {
				  HAL_GPIO_WritePin(leds_azules2[i-8].port, leds_azules2[i-8].pin, GPIO_PIN_SET);
			  }
		  }
	  }
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Configure LSE Drive Capability
  */
  HAL_PWR_EnableBkUpAccess();
  __HAL_RCC_LSEDRIVE_CONFIG(RCC_LSEDRIVE_HIGH);

  /** Configure the main internal regulator output voltage
  */
  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE|RCC_OSCILLATORTYPE_LSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.LSEState = RCC_LSE_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLM = 4;
  RCC_OscInitStruct.PLL.PLLN = 216;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
  RCC_OscInitStruct.PLL.PLLQ = 9;
  RCC_OscInitStruct.PLL.PLLR = 2;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Activate the Over-Drive mode
  */
  if (HAL_PWREx_EnableOverDrive() != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_7) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief ETH Initialization Function
  * @param None
  * @retval None
  */
static void MX_ETH_Init(void)
{

  /* USER CODE BEGIN ETH_Init 0 */

  /* USER CODE END ETH_Init 0 */

   static uint8_t MACAddr[6];

  /* USER CODE BEGIN ETH_Init 1 */

  /* USER CODE END ETH_Init 1 */
  heth.Instance = ETH;
  MACAddr[0] = 0x00;
  MACAddr[1] = 0x80;
  MACAddr[2] = 0xE1;
  MACAddr[3] = 0x00;
  MACAddr[4] = 0x00;
  MACAddr[5] = 0x00;
  heth.Init.MACAddr = &MACAddr[0];
  heth.Init.MediaInterface = HAL_ETH_RMII_MODE;
  heth.Init.TxDesc = DMATxDscrTab;
  heth.Init.RxDesc = DMARxDscrTab;
  heth.Init.RxBuffLen = 1524;

  /* USER CODE BEGIN MACADDRESS */

  /* USER CODE END MACADDRESS */

  if (HAL_ETH_Init(&heth) != HAL_OK)
  {
    Error_Handler();
  }

  memset(&TxConfig, 0 , sizeof(ETH_TxPacketConfig));
  TxConfig.Attributes = ETH_TX_PACKETS_FEATURES_CSUM | ETH_TX_PACKETS_FEATURES_CRCPAD;
  TxConfig.ChecksumCtrl = ETH_CHECKSUM_IPHDR_PAYLOAD_INSERT_PHDR_CALC;
  TxConfig.CRCPadCtrl = ETH_CRC_PAD_INSERT;
  /* USER CODE BEGIN ETH_Init 2 */

  /* USER CODE END ETH_Init 2 */

}

/**
  * @brief RNG Initialization Function
  * @param None
  * @retval None
  */
static void MX_RNG_Init(void)
{

  /* USER CODE BEGIN RNG_Init 0 */

  /* USER CODE END RNG_Init 0 */

  /* USER CODE BEGIN RNG_Init 1 */

  /* USER CODE END RNG_Init 1 */
  hrng.Instance = RNG;
  if (HAL_RNG_Init(&hrng) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN RNG_Init 2 */

  /* USER CODE END RNG_Init 2 */

}

/**
  * @brief RTC Initialization Function
  * @param None
  * @retval None
  */
static void MX_RTC_Init(void)
{

  /* USER CODE BEGIN RTC_Init 0 */

  /* USER CODE END RTC_Init 0 */

  RTC_TimeTypeDef sTime = {0};
  RTC_DateTypeDef sDate = {0};

  /* USER CODE BEGIN RTC_Init 1 */

  /* USER CODE END RTC_Init 1 */

  /** Initialize RTC Only
  */
  hrtc.Instance = RTC;
  hrtc.Init.HourFormat = RTC_HOURFORMAT_24;
  hrtc.Init.AsynchPrediv = 127;
  hrtc.Init.SynchPrediv = 255;
  hrtc.Init.OutPut = RTC_OUTPUT_DISABLE;
  hrtc.Init.OutPutPolarity = RTC_OUTPUT_POLARITY_HIGH;
  hrtc.Init.OutPutType = RTC_OUTPUT_TYPE_OPENDRAIN;
  if (HAL_RTC_Init(&hrtc) != HAL_OK)
  {
    Error_Handler();
  }

  /* USER CODE BEGIN Check_RTC_BKUP */

  /* USER CODE END Check_RTC_BKUP */

  /** Initialize RTC and set the Time and Date
  */
  sTime.Hours = 0x0;
  sTime.Minutes = 0x0;
  sTime.Seconds = 0x0;
  sTime.DayLightSaving = RTC_DAYLIGHTSAVING_NONE;
  sTime.StoreOperation = RTC_STOREOPERATION_RESET;
  if (HAL_RTC_SetTime(&hrtc, &sTime, RTC_FORMAT_BCD) != HAL_OK)
  {
    Error_Handler();
  }
  sDate.WeekDay = RTC_WEEKDAY_MONDAY;
  sDate.Month = RTC_MONTH_JANUARY;
  sDate.Date = 0x1;
  sDate.Year = 0x0;

  if (HAL_RTC_SetDate(&hrtc, &sDate, RTC_FORMAT_BCD) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN RTC_Init 2 */

  /* USER CODE END RTC_Init 2 */

}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{

  /* USER CODE BEGIN SPI1_Init 0 */

  /* USER CODE END SPI1_Init 0 */

  /* USER CODE BEGIN SPI1_Init 1 */

  /* USER CODE END SPI1_Init 1 */
  /* SPI1 parameter configuration*/
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
  hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_64;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

}

/**
  * @brief TIM1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM1_Init(void)
{

  /* USER CODE BEGIN TIM1_Init 0 */

  /* USER CODE END TIM1_Init 0 */

  TIM_MasterConfigTypeDef sMasterConfig = {0};
  TIM_OC_InitTypeDef sConfigOC = {0};
  TIM_BreakDeadTimeConfigTypeDef sBreakDeadTimeConfig = {0};

  /* USER CODE BEGIN TIM1_Init 1 */

  /* USER CODE END TIM1_Init 1 */
  htim1.Instance = TIM1;
  htim1.Init.Prescaler = 4399;
  htim1.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim1.Init.Period = 999;
  htim1.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim1.Init.RepetitionCounter = 0;
  htim1.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_PWM_Init(&htim1) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterOutputTrigger2 = TIM_TRGO2_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim1, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sConfigOC.OCMode = TIM_OCMODE_PWM2;
  sConfigOC.Pulse = 0;
  sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
  sConfigOC.OCNPolarity = TIM_OCNPOLARITY_HIGH;
  sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
  sConfigOC.OCIdleState = TIM_OCIDLESTATE_RESET;
  sConfigOC.OCNIdleState = TIM_OCNIDLESTATE_RESET;
  if (HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_2) != HAL_OK)
  {
    Error_Handler();
  }
  sBreakDeadTimeConfig.OffStateRunMode = TIM_OSSR_DISABLE;
  sBreakDeadTimeConfig.OffStateIDLEMode = TIM_OSSI_DISABLE;
  sBreakDeadTimeConfig.LockLevel = TIM_LOCKLEVEL_OFF;
  sBreakDeadTimeConfig.DeadTime = 0;
  sBreakDeadTimeConfig.BreakState = TIM_BREAK_DISABLE;
  sBreakDeadTimeConfig.BreakPolarity = TIM_BREAKPOLARITY_HIGH;
  sBreakDeadTimeConfig.BreakFilter = 0;
  sBreakDeadTimeConfig.Break2State = TIM_BREAK2_DISABLE;
  sBreakDeadTimeConfig.Break2Polarity = TIM_BREAK2POLARITY_HIGH;
  sBreakDeadTimeConfig.Break2Filter = 0;
  sBreakDeadTimeConfig.AutomaticOutput = TIM_AUTOMATICOUTPUT_DISABLE;
  if (HAL_TIMEx_ConfigBreakDeadTime(&htim1, &sBreakDeadTimeConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM1_Init 2 */

  /* USER CODE END TIM1_Init 2 */
  HAL_TIM_MspPostInit(&htim1);

}

/**
  * @brief TIM2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM2_Init(void)
{

  /* USER CODE BEGIN TIM2_Init 0 */

  /* USER CODE END TIM2_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM2_Init 1 */

  /* USER CODE END TIM2_Init 1 */
  htim2.Instance = TIM2;
  htim2.Init.Prescaler = 215;
  htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim2.Init.Period = 999;
  htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_Base_Init(&htim2) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim2, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim2, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM2_Init 2 */

  /* USER CODE END TIM2_Init 2 */

}

/**
  * @brief TIM9 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM9_Init(void)
{

  /* USER CODE BEGIN TIM9_Init 0 */

  /* USER CODE END TIM9_Init 0 */

  TIM_OC_InitTypeDef sConfigOC = {0};

  /* USER CODE BEGIN TIM9_Init 1 */

  /* USER CODE END TIM9_Init 1 */
  htim9.Instance = TIM9;
  htim9.Init.Prescaler = 4399;
  htim9.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim9.Init.Period = 999;
  htim9.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim9.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_PWM_Init(&htim9) != HAL_OK)
  {
    Error_Handler();
  }
  sConfigOC.OCMode = TIM_OCMODE_PWM2;
  sConfigOC.Pulse = 0;
  sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
  sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
  if (HAL_TIM_PWM_ConfigChannel(&htim9, &sConfigOC, TIM_CHANNEL_2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM9_Init 2 */

  /* USER CODE END TIM9_Init 2 */
  HAL_TIM_MspPostInit(&htim9);

}

/**
  * @brief USART3 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART3_UART_Init(void)
{

  /* USER CODE BEGIN USART3_Init 0 */

  /* USER CODE END USART3_Init 0 */

  /* USER CODE BEGIN USART3_Init 1 */

  /* USER CODE END USART3_Init 1 */
  huart3.Instance = USART3;
  huart3.Init.BaudRate = 115200;
  huart3.Init.WordLength = UART_WORDLENGTH_8B;
  huart3.Init.StopBits = UART_STOPBITS_1;
  huart3.Init.Parity = UART_PARITY_NONE;
  huart3.Init.Mode = UART_MODE_TX_RX;
  huart3.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart3.Init.OverSampling = UART_OVERSAMPLING_16;
  huart3.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart3.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart3) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART3_Init 2 */

  /* USER CODE END USART3_Init 2 */

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
/* USER CODE BEGIN MX_GPIO_Init_1 */
/* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOH_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();
  __HAL_RCC_GPIOG_CLK_ENABLE();
  __HAL_RCC_GPIOD_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOE, AZU1_4_Pin|VER2_4_Pin|AZU2_4_Pin|VER2_5_Pin
                          |VER2_7_Pin|VER1_1_Pin|AZU2_5_Pin|AZU1_3_Pin
                          |AZU1_1_Pin|AZU2_3_Pin|AZU2_1_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOF, VER1_2_Pin|VER2_2_Pin|AZU2_2_Pin|ROJ1_3_Pin
                          |VER1_8_Pin|ROJ1_6_Pin|ROJ1_7_Pin|AZU1_2_Pin
                          |VER1_5_Pin|VER2_1_Pin|ROJ1_1_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOC, AZU2_8_Pin|VER2_8_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOB, ROJ1_8_Pin|Reset_Pin|LEDRED_Pin|ROJ1_5_Pin
                          |DC_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOG, ROJ1_2_Pin|AZU1_6_Pin|AZU2_6_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOD, AZU1_5_Pin|AZU2_7_Pin|AZU1_8_Pin|VER1_3_Pin
                          |VER2_3_Pin|ROJ1_4_Pin|AZU1_7_Pin|VER1_7_Pin
                          |VER1_6_Pin|VER2_6_Pin|VER1_4_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(CS_GPIO_Port, CS_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pins : AZU1_4_Pin VER2_4_Pin AZU2_4_Pin VER2_5_Pin
                           VER2_7_Pin VER1_1_Pin AZU2_5_Pin AZU1_3_Pin
                           AZU1_1_Pin AZU2_3_Pin AZU2_1_Pin */
  GPIO_InitStruct.Pin = AZU1_4_Pin|VER2_4_Pin|AZU2_4_Pin|VER2_5_Pin
                          |VER2_7_Pin|VER1_1_Pin|AZU2_5_Pin|AZU1_3_Pin
                          |AZU1_1_Pin|AZU2_3_Pin|AZU2_1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pins : COMENZAR_Pin IN6_Pin IN7_Pin */
  GPIO_InitStruct.Pin = COMENZAR_Pin|IN6_Pin|IN7_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

  /*Configure GPIO pins : VER1_2_Pin VER2_2_Pin AZU2_2_Pin ROJ1_3_Pin
                           VER1_8_Pin ROJ1_6_Pin ROJ1_7_Pin AZU1_2_Pin
                           VER1_5_Pin VER2_1_Pin ROJ1_1_Pin */
  GPIO_InitStruct.Pin = VER1_2_Pin|VER2_2_Pin|AZU2_2_Pin|ROJ1_3_Pin
                          |VER1_8_Pin|ROJ1_6_Pin|ROJ1_7_Pin|AZU1_2_Pin
                          |VER1_5_Pin|VER2_1_Pin|ROJ1_1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOF, &GPIO_InitStruct);

  /*Configure GPIO pins : AZU2_8_Pin VER2_8_Pin */
  GPIO_InitStruct.Pin = AZU2_8_Pin|VER2_8_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

  /*Configure GPIO pin : INENTER_Pin */
  GPIO_InitStruct.Pin = INENTER_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(INENTER_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pins : INEXIT_Pin IN5_Pin IN8_Pin */
  GPIO_InitStruct.Pin = INEXIT_Pin|IN5_Pin|IN8_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

  /*Configure GPIO pins : ROJ1_8_Pin Reset_Pin LEDRED_Pin ROJ1_5_Pin
                           DC_Pin */
  GPIO_InitStruct.Pin = ROJ1_8_Pin|Reset_Pin|LEDRED_Pin|ROJ1_5_Pin
                          |DC_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

  /*Configure GPIO pins : ROJ1_2_Pin AZU1_6_Pin AZU2_6_Pin */
  GPIO_InitStruct.Pin = ROJ1_2_Pin|AZU1_6_Pin|AZU2_6_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOG, &GPIO_InitStruct);

  /*Configure GPIO pins : AZU1_5_Pin AZU2_7_Pin AZU1_8_Pin VER1_3_Pin
                           VER2_3_Pin ROJ1_4_Pin AZU1_7_Pin VER1_7_Pin
                           VER1_6_Pin VER2_6_Pin VER1_4_Pin */
  GPIO_InitStruct.Pin = AZU1_5_Pin|AZU2_7_Pin|AZU1_8_Pin|VER1_3_Pin
                          |VER2_3_Pin|ROJ1_4_Pin|AZU1_7_Pin|VER1_7_Pin
                          |VER1_6_Pin|VER2_6_Pin|VER1_4_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOD, &GPIO_InitStruct);

  /*Configure GPIO pins : IN3_Pin IN1_Pin IN2_Pin */
  GPIO_InitStruct.Pin = IN3_Pin|IN1_Pin|IN2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOG, &GPIO_InitStruct);

  /*Configure GPIO pin : CS_Pin */
  GPIO_InitStruct.Pin = CS_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(CS_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pin : IN4_Pin */
  GPIO_InitStruct.Pin = IN4_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(IN4_GPIO_Port, &GPIO_InitStruct);

/* USER CODE BEGIN MX_GPIO_Init_2 */
/* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
	contadorentrada++;
	contadorsalida++;
	if(contadorentrada>3000)
	{
		TIM9->CCR2 = servoenterdefault;
	}
	if(contadorsalida>3000)
	{
		TIM1->CCR2 = servoexitdefault;
	}
}
//Espacios activos
void espacio_ocupado(int num)
{
	HAL_GPIO_WritePin(leds_rojos[num].port,leds_rojos[num].pin,LEDON);
	HAL_GPIO_WritePin(leds_verdes[num].port,leds_verdes[num].pin,LEDOFF);
	HAL_GPIO_WritePin(leds_azules[num].port,leds_azules[num].pin,LEDOFF);
}
void espacio_libre(int num)
{
	HAL_GPIO_WritePin(leds_rojos[num].port,leds_rojos[num].pin,LEDOFF);
	HAL_GPIO_WritePin(leds_verdes[num].port,leds_verdes[num].pin,LEDON);
	HAL_GPIO_WritePin(leds_azules[num].port,leds_azules[num].pin,LEDOFF);
}
void espacio_reservado(int num)
{
	HAL_GPIO_WritePin(leds_rojos[num].port,leds_rojos[num].pin,LEDOFF);
	HAL_GPIO_WritePin(leds_verdes[num].port,leds_verdes[num].pin,LEDOFF);
	HAL_GPIO_WritePin(leds_azules[num].port,leds_azules[num].pin,LEDON);
}

//Espacios pasivos
void espacio_pasivo(int num)
{
	if(espacios[num] == RESERVADO)
	{
		HAL_GPIO_WritePin(leds_azules2[num-8].port,leds_azules2[num-8].pin,LEDON);
		HAL_GPIO_WritePin(leds_verdes2[num-8].port,leds_verdes2[num-8].pin,LEDOFF);
	}
	else
	{
		HAL_GPIO_WritePin(leds_azules2[num-8].port,leds_azules2[num-8].pin,LEDOFF);
		HAL_GPIO_WritePin(leds_verdes2[num-8].port,leds_verdes2[num-8].pin,LEDON);
	}
}
void preparar_msg(int id, int estado)
{
	//codificar
	int codigo;
	switch(id)
	{
		case 0:
			codigo = 1;
		break;
	  	case 1:
	  		codigo = 5;
		break;
	  	case 2:
	  		codigo = 4;
		break;
	  	case 3:
	  		codigo = 8;
		break;
	  	case 4:
	  		codigo = 10;
		break;
	  	case 5:
	  		codigo = 14;
		break;
	  	case 6:
	  		codigo = 15;
		break;
	  	case 7:
	  		codigo = 12;
		break;
	  	case 8:
	  		codigo = 2;
		break;
	  	case 9:
	  		codigo = 6;
		break;
	  	case 10:
	  		codigo = 3;
		break;
	  	case 11:
	  		codigo = 7;
		break;
	  	case 12:
	  		codigo = 9;
		break;
	  	case 13:
	  		codigo = 13;
		break;
	  	case 14:
	  		codigo = 11;
		break;
	  	case 15:
	  		codigo = 16;
		break;
	}

	//init
	char str[20];
	mensajito[0] = '\0';

	//parkingId
	strcat(mensajito, "{\"parkingId\":\"");
	if(codigo<9)
		sprintf(str, "%d", 1);
	else
		sprintf(str,"%d", 2);
	strcat(mensajito, str);

	//spotId
	strcat(mensajito, "\",\"spotId\":");
	if(codigo<9)
		sprintf(str, "%d", codigo);
	else
		sprintf(str, "%d", codigo-8);
	strcat(mensajito, str);

	//spotNumber
	strcat(mensajito, ",\"spotNumber\":\"");
	if(codigo<9)
		strcat(mensajito, ids[codigo-1]);
	else
		strcat(mensajito, ids[codigo-9]);

	//estado
	strcat(mensajito, "\",\"estado\":\"");
	strcat(mensajito, estados[estado]);

	//timestamp
	sprintf(str,"\",\"timestamp\":%lld}",(long long)time(NULL)*1000);
	strcat(mensajito, str);

}

void decodificar_msg()
{
	int codigo;
	int estadin;
	rxflag = 0;
	token = strtok_r(mystr, outer_delimiter, &outer_saveptr);
	parkingId = strtok_r(token, inner_delimiter, &inner_saveptr); //Muestra {
	parkingId = strtok_r(NULL, inner_delimiter, &inner_saveptr);  //Muestra el atributo
	parkingId = strtok_r(NULL, inner_delimiter, &inner_saveptr);  //Muestra el valor

	token = strtok_r(NULL, outer_delimiter, &outer_saveptr);
	spotId = strtok_r(token, inner_delimiter, &inner_saveptr); //Muestra el atributo
	spotId = strtok_r(NULL, inner_delimiter, &inner_saveptr);  //Muestra el valor

	token = strtok_r(NULL, outer_delimiter, &outer_saveptr);
	spotNumber = strtok_r(token, inner_delimiter, &inner_saveptr); //Muestra el atributo
	spotNumber = strtok_r(NULL, inner_delimiter, &inner_saveptr);  //Muestra el valor

	token = strtok_r(NULL, outer_delimiter, &outer_saveptr);
	estadonuevo = strtok_r(token, inner_delimiter, &inner_saveptr); //Muestra el atributo
	estadonuevo = strtok_r(NULL, inner_delimiter, &inner_saveptr);  //Muestra el valor

	token = strtok_r(NULL, outer_delimiter, &outer_saveptr);
	mitimestamp = strtok_r(token, inner_delimiter, &inner_saveptr); //Muestra el atributo
	mitimestamp = strtok_r(NULL, inner_delimiter, &inner_saveptr);  //Muestra el valor

	if(strcmp(estadonuevo,"reservado")==0)
	{
		  estadin = RESERVADO;
	}
	else
	{
		  estadin = LIBRE;
	}
	if(parkingId[0] == '1')
	{
		switch(spotId[0])
		{
			case '1':
				codigo = 0;
			break;
			case '2':
				codigo = 8;
			break;
			case '3':
				codigo = 10;
			break;
			case '4':
				codigo = 2;
			break;
			case '5':
				codigo = 1;
			break;
			case '6':
				codigo = 9;
			break;
			case '7':
				codigo = 11;
			break;
			case '8':
				codigo = 3;
			break;
		}
	}
	else
	{
		switch(spotId[0])
		{
			case '1':
				codigo = 12;
			break;
			case '2':
				codigo = 4;
			break;
			case '3':
				codigo = 14;
			break;
			case '4':
				codigo = 7;
			break;
			case '5':
				codigo = 13;
			break;
			case '6':
				codigo = 5;
			break;
			case '7':
				codigo = 6;
			break;
			case '8':
				codigo = 15;
			break;
		}
	}
	espacios[codigo] = estadin;
}

void updateTime()
{
	struct tm timeinfo = {0};

	RTC_TimeTypeDef aTime = {0};
	RTC_DateTypeDef aDate = {0};
	timepos = (mg_now()/1000);
	gmtime_r(&timepos, &timeinfo);
	aTime.Hours = timeinfo.tm_hour;
	aTime.Minutes = timeinfo.tm_min;
	aTime.Seconds = timeinfo.tm_sec;
	aTime.DayLightSaving = timeinfo.tm_isdst;
	aTime.StoreOperation = RTC_STOREOPERATION_RESET;
	if (HAL_RTC_SetTime(&hrtc, &aTime, RTC_FORMAT_BIN) != HAL_OK)
	{
	    Error_Handler();
	}
	aDate.WeekDay = timeinfo.tm_wday;
	aDate.Month = timeinfo.tm_mon + 1;
	aDate.Date = timeinfo.tm_mday;
	aDate.Year = timeinfo.tm_year - 100;
	if (HAL_RTC_SetDate(&hrtc, &aDate, RTC_FORMAT_BIN) != HAL_OK)
	{
	 Error_Handler();
	}
	// Get's the time and dat from RTC
	HAL_RTC_GetTime(&hrtc, &aTime, RTC_FORMAT_BIN);
	HAL_RTC_GetDate(&hrtc, &aDate, RTC_FORMAT_BIN);
}

void abrirPluma(TIM_TypeDef * timer, int inout)
{
	if(inout)
	{
		contadorentrada = 0;
		timer->CCR2 = servoenterup;
	}
	else
	{
		contadorsalida = 0;
		timer->CCR2 = servoexitup;
	}
}
/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}

#ifdef  USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
