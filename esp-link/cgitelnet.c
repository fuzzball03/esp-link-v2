#include <esp8266.h>
#include "cgi.h"
#include "config.h"
#include "serbridge.h"

// The three definitions below need to match with each other, and with the content of html/ui.js:ajaxSelectPresets
const static int nPortModes = 4;
static char *portMode[] = {
  "open",
  "disabled",
  "secure",
  "password"
};
static int portModeBits[] = {
  /* open */		SER_BRIDGE_MODE_NONE,
  /* disabled */	SER_BRIDGE_MODE_DISABLED,
  /* secure */		SER_BRIDGE_MODE_SECURE,
  /* password */	SER_BRIDGE_MODE_PASSWORD
};

static int string2portMode(char *s);
static char *portMode2string(int8_t m);

// Cgi to return choice of Telnet ports
int ICACHE_FLASH_ATTR cgiTelnetGet(HttpdConnData *connData) {
  char buff[80];

  if (connData->conn == NULL) return HTTPD_CGI_DONE;  // Connection aborted

  int len;

  os_printf("Current telnet ports: port0=%d (mode %d %s) port1=%d (mode %d %s)\n",
    flashConfig.telnet_port0, flashConfig.telnet_port0mode, portMode2string(flashConfig.telnet_port0mode),
    flashConfig.telnet_port1, flashConfig.telnet_port1mode, portMode2string(flashConfig.telnet_port1mode));

  len = os_sprintf(buff,
    "{ \"port0\": \"%d\", \"port1\": \"%d\", \"port0mode\": \"%s\", \"port1mode\": \"%s\" }",
    flashConfig.telnet_port0, flashConfig.telnet_port1,
    portMode[flashConfig.telnet_port0mode], portMode[flashConfig.telnet_port1mode]);

  jsonHeader(connData, 200);
  httpdSend(connData, buff, len);

  return HTTPD_CGI_DONE;
}

/*
 * Cgi to change choice of Telnet ports
 *
 * Can be called with several URLs :
 *	PUT http://esp-link/telnet?port1=35
 *	PUT http://esp-link/telnet?port0mode=open&port1mode=secure
 */
int ICACHE_FLASH_ATTR cgiTelnetSet(HttpdConnData *connData) {
  char buf[80];

  if (connData->conn == NULL) {
    return HTTPD_CGI_DONE;  // Connection aborted
  }

  int8_t ok0, ok1;
  uint16_t port0, port1;
  ok0 = getUInt16Arg(connData, "port0", &port0);
  ok1 = getUInt16Arg(connData, "port1", &port1);
  os_printf("cgiTelnetSet ok0 %d ok1 %d port0 %d port1 %d\n", ok0, ok1, port0,
            port1);

  if (ok0 == 1) flashConfig.telnet_port0 = port0;
  if (ok1 == 1) flashConfig.telnet_port1 = port1;

  // Change port mode
  int mok0, mok1;
  char port0mode[16], port1mode[16];
  mok0 = getStringArg(connData, "port0mode", port0mode, sizeof(port0mode));
  mok1 = getStringArg(connData, "port1mode", port1mode, sizeof(port1mode));

  os_printf("cgiTelnetSet mok0 %d mok1 %d port0 %s port1 %s\n", mok0, mok1, port0mode, port1mode);
  int mode0 = string2portMode(port0mode);
  int mode1 = string2portMode(port1mode);
  if (mok0 == 1) flashConfig.telnet_port0mode = mode0;
  if (mok1 == 1) flashConfig.telnet_port1mode = mode1;

  // check whether ports are different
  if (flashConfig.telnet_port0 == flashConfig.telnet_port1) {
    os_sprintf(buf,
               "Ports cannot be the same.\n Tried to set: port0=%d port1=%d\n",
               flashConfig.telnet_port0, flashConfig.telnet_port1);
    os_printf(buf);
    errorResponse(connData, 400, buf);
    return HTTPD_CGI_DONE;
  }

  os_printf("Telnet ports changed: port0=%d port1=%d\n",
            flashConfig.telnet_port0, flashConfig.telnet_port1);

  // save to flash
  if (configSave()) {
    httpdStartResponse(connData, 204);
    httpdEndHeaders(connData);
  } else {
    httpdStartResponse(connData, 500);
    httpdEndHeaders(connData);
    httpdSend(connData, "Failed to save config", -1);
  }

  // apply the changes
  serbridgeInit();
  serbridgeStart(0, flashConfig.telnet_port0, flashConfig.telnet_port0mode);
  serbridgeStart(1, flashConfig.telnet_port1, flashConfig.telnet_port1mode);

  return HTTPD_CGI_DONE;
}

int ICACHE_FLASH_ATTR cgiTelnet(HttpdConnData *connData) {
  if (connData->conn == NULL)
    return HTTPD_CGI_DONE;  // Connection aborted. Clean up.
  if (connData->requestType == HTTPD_METHOD_GET) {
    return cgiTelnetGet(connData);
  } else if (connData->requestType == HTTPD_METHOD_POST) {
    return cgiTelnetSet(connData);
  } else {
    jsonHeader(connData, 404);
    return HTTPD_CGI_DONE;
  }
}

static char *portMode2string(int8_t m) { //Should we put this into flash?
  if (m < 0 || m >= nPortModes)
    return "?";
  return portMode[m];
}

static int string2portMode(char *s) {
  for (int i=0; i<nPortModes; i++)
    if (strcmp(s, portMode[i]) == 0) {
  os_printf("string2portMode(%s) -> %d\n", s, portModeBits[i]);
      return i;
    }
  os_printf("string2portMode(%s) -> %d\n", s, -1);
  return -1;
}

// print various Telnet information into json buffer
int ICACHE_FLASH_ATTR printTelnetSecurity(char *buff) {
  int len;

  len = os_sprintf(buff,
                   "{ \"port0mode\": \"%s\", \"port0portnumber\": \"%d\", "
                   "\"port0pwd\": \"%s\", "
                   "\"port1mode\": \"%s\", \"port1portnumber\": \"%d\", "
                   "\"port1pwd\": \"%s\" }",
                   portMode2string(flashConfig.telnet_port0mode),
                   flashConfig.telnet_port0, flashConfig.telnet_port0pass,
                   portMode2string(flashConfig.telnet_port1mode),
                   flashConfig.telnet_port1, flashConfig.telnet_port1pass);

  return len;
}
