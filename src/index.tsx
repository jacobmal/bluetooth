import {
  ButtonItem,
  definePlugin,
  //DialogButton,
  // Menu,
  // MenuItem,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  //showContextMenu,
  staticClasses,
} from "decky-frontend-lib";
import { useState, VFC } from "react";
import { FaBluetooth } from "react-icons/fa";

interface GetDeviceInfoArgs {
  device: string
}

interface PairedDevice {
  mac: string,
  name: string,
  connected: boolean
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  const [devices, setDevices] = useState<Array<PairedDevice>>([]);

  const onClick = async () => {
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

  const deviceDisplay = devices.map((device, index) => 
  {
    return (
      <ButtonItem 
        layout="below"
        onClick={() => {}}
      >
        {index} {device.name} {device.mac} {String(device.connected)}
      </ButtonItem>
    )
  });

  return (
    <PanelSection title="Panel Section">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() =>
            onClick()
          }
        >
          Get Bluetooth devices
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        {deviceDisplay}
      </PanelSectionRow>
    </PanelSection>
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
      connected: /Connected: yes/.test(rawInfo.result),
      //icon: /Icon: (.*)/.exec(rawInfo)[1],
    });
  }
  return pairedDevicesWithInfo;
}

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>Bluetooth 2.0</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaBluetooth />,
  };
});
