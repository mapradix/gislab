# GIS.lab client account configuration script


# create main configuration directories first
mkdir /etc/skel/.config
mkdir /etc/skel/.local


# applications menu
mkdir -p /etc/skel/.config/menus
cp $GISLAB_ROOT/system/account/desktop-session/menus/xfce-applications.menu /etc/skel/.config/menus/

mkdir -p /etc/skel/.local/share/applications
cp $GISLAB_ROOT/system/account/desktop-session/menus/*.desktop /etc/skel/.local/share/applications/

mkdir -p /etc/skel/.local/share/desktop-directories
cp $GISLAB_ROOT/system/account/desktop-session/menus/*.directory /etc/skel/.local/share/desktop-directories/


# GIS.lab desktop session and panel
mkdir -p /etc/skel/.config/xfce4/xfconf/xfce-perchannel-xml

cp $GISLAB_ROOT/system/account/desktop-session/xfce4/xinitrc /etc/skel/.config/xfce4/

cp $GISLAB_ROOT/system/account/desktop-session/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml /etc/skel/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml
cp $GISLAB_ROOT/system/account/desktop-session/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml /etc/skel/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml

mkdir -p /etc/skel/.config/xfce4/panel
cp -a $GISLAB_ROOT/system/account/desktop-session/xfce4/panel/* /etc/skel/.config/xfce4/panel

# keyboard languages
languages="us" # english is always active
variants=""
for lang in ${!GISLAB_CLIENT_LANGUAGES[*]}
do
	languages+=",${GISLAB_CLIENT_LANGUAGES[$lang]}"
	variants+=","
done
sed -i "s/^layouts=/layouts=$languages/" /etc/skel/.config/xfce4/panel/xkb-plugin-14.rc
sed -i "s/^variants=/variants=$variants/" /etc/skel/.config/xfce4/panel/xkb-plugin-14.rc


# Conky
mkdir -p /etc/skel/.config/autostart
cp $GISLAB_ROOT/system/account/desktop-session/conky/conkyrc /etc/skel/.conkyrc
cp $GISLAB_ROOT/system/account/desktop-session/conky/conky.desktop /etc/skel/.config/autostart/conky.desktop


# Pidgin
mkdir -p /etc/skel/.purple
cp -a $GISLAB_ROOT/system/account/pidgin/*.xml /etc/skel/.purple
#cp $GISLAB_ROOT/system/account/pidgin/pidgin.desktop /etc/skel/.config/autostart/pidgin.desktop


# PostgreSQL
cp $GISLAB_ROOT/system/account/pgadmin3/pgadmin3 /etc/skel/.pgadmin3


# QGIS
mkdir -p /etc/skel/.config/QGIS
mkdir -p /etc/skel/.qgis2
cp $GISLAB_ROOT/system/account/qgis/QGIS2.conf /etc/skel/.config/QGIS/QGIS2.conf

if [ "$GISLAB_CLIENT_GIS_DEVELOPMENT_SUPPORT" == "yes" ]; then
	mkdir -p /etc/skel/bin
	cp $GISLAB_ROOT/system/account/qgis/bin/gislab-dev-* /etc/skel/bin
	chmod 755 /etc/skel/bin/*
fi


# final skeleton owner setting
chown -R root:root /etc/skel


# vim: set ts=4 sts=4 sw=4 noet: