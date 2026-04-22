/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.h
  * @brief          : Header for main.c file.
  *                   This file contains the common defines of the application.
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

/* Define to prevent recursive inclusion -------------------------------------*/
#ifndef __MAIN_H
#define __MAIN_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "stm32f7xx_hal.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* Exported types ------------------------------------------------------------*/
/* USER CODE BEGIN ET */

/* USER CODE END ET */

/* Exported constants --------------------------------------------------------*/
/* USER CODE BEGIN EC */

/* USER CODE END EC */

/* Exported macro ------------------------------------------------------------*/
/* USER CODE BEGIN EM */

/* USER CODE END EM */

void HAL_TIM_MspPostInit(TIM_HandleTypeDef *htim);

/* Exported functions prototypes ---------------------------------------------*/
void Error_Handler(void);

/* USER CODE BEGIN EFP */

/* USER CODE END EFP */

/* Private defines -----------------------------------------------------------*/
#define AZU1_4_Pin GPIO_PIN_2
#define AZU1_4_GPIO_Port GPIOE
#define VER2_4_Pin GPIO_PIN_3
#define VER2_4_GPIO_Port GPIOE
#define AZU2_4_Pin GPIO_PIN_4
#define AZU2_4_GPIO_Port GPIOE
#define COMENZAR_Pin GPIO_PIN_13
#define COMENZAR_GPIO_Port GPIOC
#define VER1_2_Pin GPIO_PIN_0
#define VER1_2_GPIO_Port GPIOF
#define VER2_2_Pin GPIO_PIN_1
#define VER2_2_GPIO_Port GPIOF
#define AZU2_2_Pin GPIO_PIN_2
#define AZU2_2_GPIO_Port GPIOF
#define ROJ1_3_Pin GPIO_PIN_3
#define ROJ1_3_GPIO_Port GPIOF
#define VER1_8_Pin GPIO_PIN_4
#define VER1_8_GPIO_Port GPIOF
#define ROJ1_6_Pin GPIO_PIN_6
#define ROJ1_6_GPIO_Port GPIOF
#define ROJ1_7_Pin GPIO_PIN_7
#define ROJ1_7_GPIO_Port GPIOF
#define AZU1_2_Pin GPIO_PIN_8
#define AZU1_2_GPIO_Port GPIOF
#define VER1_5_Pin GPIO_PIN_10
#define VER1_5_GPIO_Port GPIOF
#define AZU2_8_Pin GPIO_PIN_0
#define AZU2_8_GPIO_Port GPIOC
#define VER2_8_Pin GPIO_PIN_3
#define VER2_8_GPIO_Port GPIOC
#define INENTER_Pin GPIO_PIN_4
#define INENTER_GPIO_Port GPIOA
#define INEXIT_Pin GPIO_PIN_0
#define INEXIT_GPIO_Port GPIOB
#define ROJ1_8_Pin GPIO_PIN_1
#define ROJ1_8_GPIO_Port GPIOB
#define VER2_1_Pin GPIO_PIN_14
#define VER2_1_GPIO_Port GPIOF
#define ROJ1_1_Pin GPIO_PIN_15
#define ROJ1_1_GPIO_Port GPIOF
#define ROJ1_2_Pin GPIO_PIN_0
#define ROJ1_2_GPIO_Port GPIOG
#define VER2_5_Pin GPIO_PIN_7
#define VER2_5_GPIO_Port GPIOE
#define VER2_7_Pin GPIO_PIN_8
#define VER2_7_GPIO_Port GPIOE
#define VER1_1_Pin GPIO_PIN_9
#define VER1_1_GPIO_Port GPIOE
#define AZU2_5_Pin GPIO_PIN_10
#define AZU2_5_GPIO_Port GPIOE
#define AZU1_3_Pin GPIO_PIN_12
#define AZU1_3_GPIO_Port GPIOE
#define AZU1_1_Pin GPIO_PIN_13
#define AZU1_1_GPIO_Port GPIOE
#define AZU2_3_Pin GPIO_PIN_14
#define AZU2_3_GPIO_Port GPIOE
#define AZU2_1_Pin GPIO_PIN_15
#define AZU2_1_GPIO_Port GPIOE
#define Reset_Pin GPIO_PIN_10
#define Reset_GPIO_Port GPIOB
#define IN5_Pin GPIO_PIN_11
#define IN5_GPIO_Port GPIOB
#define IN8_Pin GPIO_PIN_12
#define IN8_GPIO_Port GPIOB
#define LEDRED_Pin GPIO_PIN_14
#define LEDRED_GPIO_Port GPIOB
#define ROJ1_5_Pin GPIO_PIN_15
#define ROJ1_5_GPIO_Port GPIOB
#define AZU1_5_Pin GPIO_PIN_11
#define AZU1_5_GPIO_Port GPIOD
#define AZU2_7_Pin GPIO_PIN_12
#define AZU2_7_GPIO_Port GPIOD
#define AZU1_8_Pin GPIO_PIN_13
#define AZU1_8_GPIO_Port GPIOD
#define VER1_3_Pin GPIO_PIN_14
#define VER1_3_GPIO_Port GPIOD
#define VER2_3_Pin GPIO_PIN_15
#define VER2_3_GPIO_Port GPIOD
#define AZU1_6_Pin GPIO_PIN_2
#define AZU1_6_GPIO_Port GPIOG
#define AZU2_6_Pin GPIO_PIN_3
#define AZU2_6_GPIO_Port GPIOG
#define IN3_Pin GPIO_PIN_5
#define IN3_GPIO_Port GPIOG
#define IN1_Pin GPIO_PIN_6
#define IN1_GPIO_Port GPIOG
#define CS_Pin GPIO_PIN_8
#define CS_GPIO_Port GPIOA
#define IN6_Pin GPIO_PIN_10
#define IN6_GPIO_Port GPIOC
#define IN7_Pin GPIO_PIN_12
#define IN7_GPIO_Port GPIOC
#define ROJ1_4_Pin GPIO_PIN_0
#define ROJ1_4_GPIO_Port GPIOD
#define AZU1_7_Pin GPIO_PIN_3
#define AZU1_7_GPIO_Port GPIOD
#define VER1_7_Pin GPIO_PIN_4
#define VER1_7_GPIO_Port GPIOD
#define VER1_6_Pin GPIO_PIN_5
#define VER1_6_GPIO_Port GPIOD
#define VER2_6_Pin GPIO_PIN_6
#define VER2_6_GPIO_Port GPIOD
#define VER1_4_Pin GPIO_PIN_7
#define VER1_4_GPIO_Port GPIOD
#define IN2_Pin GPIO_PIN_9
#define IN2_GPIO_Port GPIOG
#define DC_Pin GPIO_PIN_4
#define DC_GPIO_Port GPIOB
#define IN4_Pin GPIO_PIN_1
#define IN4_GPIO_Port GPIOE

/* USER CODE BEGIN Private defines */

/* USER CODE END Private defines */

#ifdef __cplusplus
}
#endif

#endif /* __MAIN_H */
