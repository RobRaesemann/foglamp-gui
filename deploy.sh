#!/usr/bin/env bash
set -e

__author__="Mohd. Shariq"
__copyright__="Copyright (c) 2017-18 DIANOMIC SYSTEMS"
__license__="Apache 2.0"
__version__="1.2.0"

# Colors
CPFX="\033["

CRESET="${CPFX}0m"          # Text Reset
CERR="${CPFX}1;31m"
CINFO="${CPFX}1;32m"
CWARN="${CPFX}0;33m"

echo -e "${CWARN}This script is partially done, please track https://github.com/foglamp/foglamp-gui/issues/73 ${CRESET}"

# Variables
FOGLAMP_GUI_VER=1.2.0

machine_details() {
  # OS Type
  os=$(uname)
  echo -e "${CINFO}Operating System Type :${CRESET} ${os} "

  if [[ ${os} == "Darwin" ]]
  then
      echo -e Error:"${CERR} Script is not compatible with macOS ${CRESET}"
      exit 1
  fi

  # Hostname
  echo -e "${CINFO}Hostname : ${CRESET} ${HOSTNAME} "

  # Internal IP
  internal_ip=$(hostname -I)
  echo -e "${CINFO}Internal IP : ${CRESET} ${internal_ip}"

  # External IP
  external_ip=$(curl -s ipecho.net/plain;echo)
  echo -e "${CINFO}External IP : ${CRESET} ${external_ip}"
  echo     # new line
}

memory_footprints(){
  # Check RAM and SWAP Usages
  rm -f /tmp/ramcache
  free -h | grep -v + > /tmp/ramcache

  echo -e "${CINFO}Memory Usages : ${CRESET}"
  cat /tmp/ramcache
  echo     # new line

  # Check Disk Usages
  rm -f /tmp/diskusage
  # TODO: add check for ubuntu vs raspbian, and PRINT for ubuntu machine too
  sudo fdisk -l| grep 'Device\|/dev/mmcblk0*' > /tmp/diskusage
  echo -e "${CINFO}Disk Usages : ${CRESET}"
  cat /tmp/diskusage
  echo     # new line
}

nginx_health(){
  if ! which nginx > /dev/null 2>&1; then
    echo -e "${CERR} FogLAMP GUI can not run, As Nginx(-light) is not installed.${CRESET}"
    echo -e "${CINFO} Run ./deploy.sh without any argument to install the foglamp gui with nginx-light.${CRESET}"
  else
    machine_details

    memory_footprints

    nginx_version=$(nginx -v 2>&1)
    echo -e INFO: "${CINFO}Found ${nginx_version}${CRESET}"

    nginx_status=$(sudo service nginx status | grep active 2>&1)
    echo -e "${CINFO}Status: ${nginx_status}${CRESET}"

    echo "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND"
    ps aux -P | grep [n]ginx

  fi
}

install () {
  if ! which nginx > /dev/null 2>&1; then
      echo -e WARNING: "${CWARN} Nginx not installed ${CRESET}"
      yes Y | sudo apt-get install nginx-light
  else
      nginx_version=$(nginx -v 2>&1)
      echo -e INFO: "${CINFO} Found ${nginx_version} ${CRESET}"
  fi

  if [[ "$OPTION" != "LOCAL" ]] 
  then
    echo -e INFO: "${CINFO} Downloading foglamp-gui release build from git ${CRESET}"
    BUILD_URL=https://github.com/foglamp/foglamp-gui/releases/download/v${FOGLAMP_GUI_VER}/foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz
    wget ${BUILD_URL} --show-progress --quiet
  fi

  # FIXME: scp foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz pi@<IP>:/home/pi
  tar -zxvf foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz

  # put them into /var/www/html and start nginx
  sudo rm -rf /var/www/html/*
  sudo mv dist/* /var/www/html/.
  sudo rm -rf dist

  # FIXME: if --keep, then don't remove
  sudo rm -rf foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz

  echo -e INFO: "${CINFO} nginx status ${CRESET}"
  sudo service nginx stop
  sudo service nginx start

  sudo service nginx status | grep "Active:"
}

############################################################
# Usage text for this script
############################################################
USAGE="$__version__

DESCRIPTION
  This script installs foglamp-gui with nginx-light

OPTIONS
  Multiple commands can be specified but they all must be
  specified separately (-hv is not supported).

  -h, --help                Display this help text
  -v, --version             Display this script's version information
  -H, --health, --dry-run   Run health check for nginx
  -L, --local               Deploy on local with an internal call to ./build.sh


EXAMPLES
  ./$0 --version"

############################################################
# Execute the command specified in $OPTION
############################################################
execute_command() {

  if [[ "$OPTION" == "HELP" ]]
  then
    echo "${USAGE}"

  elif [[ "$OPTION" == "VERSION" ]]
  then
    echo $__version__

  elif [[ "$OPTION" == "HEALTH" ]]
  then
    nginx_health

  elif [[ "$OPTION" == "LOCAL" ]]
  then
    machine_details
    ./build.sh
    install

  fi
}

start () {
  machine_details
  memory_footprints
  install
  memory_footprints
}

############################################################
# Process arguments
############################################################
if [ $# -gt 0 ]
then
  for i in "$@"
  do
    case $i in
      -h|--help)
        OPTION="HELP"
      ;;

      -v|--version)
        OPTION="VERSION"
      ;;

      -H|--health|--dry-run)
        OPTION="HEALTH"
      ;;

      -L|--local)
        OPTION="LOCAL"
      ;;

      *)
        echo "Unrecognized option: $i"
    esac
    execute_command
  done
else
  start
fi
