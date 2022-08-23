import {
  ButtonItem,
  definePlugin,
  //DialogButton,
  // Menu,
  // MenuItem,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  //showContextMenu,
  staticClasses,
} from "decky-frontend-lib";
import { useState, VFC, Fragment } from "react";
import { FaBluetooth } from "react-icons/fa";

interface GetDeviceInfoArgs {
  device: string
}

interface ToggleDeviceInfoArgs {
  device: string,
  status: boolean
}

interface PairedDevice {
  mac: string,
  name: string,
  connected: boolean,
  icon?: string
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  const [devices, setDevices] = useState<Array<PairedDevice>>([]);

  const refreshDevices = async () => {
    const result = await serverAPI.callPluginMethod<{}, string>(
      "get_paired_devices",
      {}
    );
    if (result.success) {
      const pairedDevices = await parsePariedDevices(serverAPI, result.result)
      setDevices(pairedDevices);
    }
    else {
      setDevices([]);
    }
  };

  const deviceDisplay = devices.map((device) => 
  {
    return (
      <ButtonItem 
        layout="below"
        onClick={async () =>  {
            await toggleDeviceConnection(serverAPI, device);
            await refreshDevices();
          }
        }
      >
        {device.name} {device.connected ? "- Connected" : ""}
      </ButtonItem>
    )
  });

  return (
    <Fragment>
      <PanelSection>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() =>
              refreshDevices()
            }
          >
            Get Bluetooth devices
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Paired Devices">
        <PanelSectionRow>
          {deviceDisplay}
        </PanelSectionRow>
      </PanelSection>
    </Fragment>
  );
};

async function parsePariedDevices(serverApi: ServerAPI, pairedDevices: string) {
  // Get MAC address and device name of paired devices
  const pairedDevicesWithInfo: Array<PairedDevice> = [];
  for (let captureGroups of [...pairedDevices.matchAll(/Device (([0-9A-F]{2}[:-]){5}([0-9A-F]{2})) (.*)$/gmi)]) {
    const mac = captureGroups[1];
    const name = captureGroups[4];

    const rawInfo = await serverApi.callPluginMethod<GetDeviceInfoArgs, string>('get_device_info', { device: mac });
    pairedDevicesWithInfo.push({
      mac,
      name,
      connected: /Connected: yes/.test(rawInfo.result)
    });
  }
  return pairedDevicesWithInfo;
}

async function toggleDeviceConnection(serverApi: ServerAPI, device: PairedDevice) {
  await serverApi.callPluginMethod<ToggleDeviceInfoArgs, string>('toggle_device_connection', { device: device.mac, status: device.connected })
}

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>Bluetooth 2.0</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaBluetooth />,
  };
});
