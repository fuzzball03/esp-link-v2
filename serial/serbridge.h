#ifndef __SER_BRIDGE_H__
#define __SER_BRIDGE_H__

#include <ip_addr.h>
#include <c_types.h>
#include <espconn.h>

#define SER_BRIDGE_MAX_CONN 4
#define MAX_CONN SER_BRIDGE_MAX_CONN	/* FIXME to be removed */
#define	SER_BRIDGE_MAX_PORTS    2
#define SER_BRIDGE_TIMEOUT 300 // 300 seconds = 5 minutes

// Least significant bits indicate security mode
enum serbridgeModeEnum {
  SER_BRIDGE_MODE_NONE = 0,
  SER_BRIDGE_MODE_DISABLED,
  SER_BRIDGE_MODE_SECURE,
  SER_BRIDGE_MODE_PASSWORD
};

// An additional bit indicates programming
#define	SER_BRIDGE_MODE_PROGRAMMING	0x10

// Send buffer size
#define MAX_TXBUFFER (2*1460)

enum connModes {
  cmInit = 0,        // initialization mode: nothing received yet
  cmPGMInit,         // initialization mode for programming
  cmTransparent,     // transparent mode
  cmPGM,             // Arduino/AVR/ARM programming mode
  cmTelnet,          // use telnet escape sequences for programming mode
};

typedef struct serbridgeConnData {
  struct espconn *conn;
  enum connModes conn_mode;     // connection mode
  uint8_t        telnet_state;
  uint16         txbufferlen;   // length of data in txbuffer
  char           *txbuffer;     // buffer for the data to send
  char           *sentbuffer;   // buffer sent, awaiting callback to get freed
  uint32_t       txoverflow_at; // when the transmitter started to overflow
  bool           readytosend;   // true, if txbuffer can be sent by espconn_sent
  bool		 secure;	// use SSL calls for this connection
  // No need for "programming" variable, is already in (conn_mode = cmPGMInit)
  // bool	 programming;	// are we in programming mode on this connection
} serbridgeConnData;

typedef struct serbridgePortData {
  int                  mode;
  struct espconn       *conn;
  struct esp_tcp       *tcp;
  serbridgeConnData    *connData;
} serbridgePortData;


// port1 is transparent&programming, second port is programming only
void ICACHE_FLASH_ATTR serbridgeInit();
void ICACHE_FLASH_ATTR serbridgeStart(int ix, int port, int mode);
void ICACHE_FLASH_ATTR serbridgeInitPins(void);
void ICACHE_FLASH_ATTR serbridgeUartCb(char *buf, short len);
void ICACHE_FLASH_ATTR serbridgeReset();
int  ICACHE_FLASH_ATTR serbridgeInMCUFlashing();
void ICACHE_FLASH_ATTR serbridgeClose();


// callback when receiving UART chars when in programming mode
extern void (*programmingCB)(char *buffer, short length);

#endif /* __SER_BRIDGE_H__ */
