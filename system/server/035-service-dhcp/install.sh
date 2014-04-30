#
### DHCP SERVER ###
#

# adding Apparmor profile to enable including allowed MACs from /etc/ltsp/dhcpd-machines-allowed.conf
cat << EOF > /etc/apparmor.d/local/usr.sbin.dhcpd
$(gislab_config_header)
/etc/ltsp/dhcpd-machines-allowed.conf lrw,
EOF
service apparmor restart

# creating empty MACs file
cat << EOF > /etc/ltsp/dhcpd-machines-allowed.conf
$(gislab_config_header)
group {
}
EOF

# DHCP server configuration
cat << EOF > /etc/ltsp/dhcpd.conf
$(gislab_config_header)
log-facility local7;

authoritative;

subnet $GISLAB_NETWORK.0 netmask 255.255.255.0 {
    option routers $GISLAB_SERVER_IP;

    pool {
        $GISLAB_UNKNOWN_MAC_POLICY unknown clients;
        range $GISLAB_NETWORK.100 $GISLAB_NETWORK.250;
        option domain-name "gis.lab";
        option domain-name-servers $GISLAB_SERVER_IP;
        option broadcast-address $GISLAB_NETWORK.255;
        option subnet-mask 255.255.255.0;
        option root-path "/opt/ltsp/i386";
        if substring( option vendor-class-identifier, 0, 9 ) = "PXEClient" {
            filename "/ltsp/i386/pxelinux.0";
        } else {
            filename "/ltsp/i386/nbi.img";
        }
    }
}
EOF

# disable logging to /var/log/syslog and touch /var/log/dhcpd-error.log
# to run logcheck successfuly
if [ ! -f /etc/gislab/035-service-dhcp.done ]; then
	sed -i 's|\(^.\+[^[:space:]]\)\([[:space:]]\+\)-/var/log/syslog$|\1,local7.none\2-/var/log/syslog|' /etc/rsyslog.d/50-default.conf
	touch /var/log/dhcpd-error.log
	chown root:adm /var/log/dhcpd-error.log
	chmod 0640 /var/log/dhcpd-error.log
fi

sed -i '/^local7\.err[[:space:]]\+\/var\/log\/dhcpd-error.log/d' /etc/rsyslog.d/50-default.conf
sed -i '/^local7\.\*[[:space:]]\+\/var\/log\/dhcpd-debug.log/d' /etc/rsyslog.d/50-default.conf

if [ "$GISLAB_DEBUG_SERVICES" == "yes" ]; then
	# in debug mode log everything to /var/log/dhcpd-debug.log
	echo "local7.* /var/log/dhcpd-debug.log" >> /etc/rsyslog.d/50-default.conf
else
	# in non debug mode log only erros to /var/log/dhcpd-error.log
	echo "local7.err /var/log/dhcpd-error.log" >> /etc/rsyslog.d/50-default.conf
fi

if [ "$GISLAB_UNKNOWN_MAC_POLICY" == "deny" ]; # if unknown MACs are denied, load known ones from included file
then
    cat << EOF >> /etc/ltsp/dhcpd.conf
include "/etc/ltsp/dhcpd-machines-allowed.conf";
EOF

	# allow client's MACs
	/vagrant/system/bin/gislab-allowmachines
fi

cat << EOF > /etc/default/isc-dhcp-server
$(gislab_config_header)
INTERFACES="eth1"
EOF

service isc-dhcp-server restart


# vim: set syntax=sh ts=4 sts=4 sw=4 noet: