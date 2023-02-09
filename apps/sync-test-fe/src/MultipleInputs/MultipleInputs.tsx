import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Sync, _SyncManager } from "@sam98231/reactive";
import {
  Col,
  Row,
  Slider,
  Switch,
  Radio,
  InputNumber,
  Timeline,
  Button,
  Avatar,
  Input,
  Form,
} from "antd";
import Card from "../components/Card";

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
}

const SyncManager = new _SyncManager();

const d = {
  value: 0,
  text: "hello\n",
  slider: 20,
  radio: "a",
  inputNumber: 0,
  peopleInRoom: 1,
  timelineItems: [0, 1],
  step: 2,
  formField1: "",
  formField2: "",
};

const AVATAR_COLORS = [
  "#f56a00",
  "#87d068",
  "#1890ff",
  "#f56a00",
  "#87d068",
  "#1890ff",
  "#f56a00",
  "#87d068",
  "#1890ff",
  "#f56a00",
  "#87d068",
  "#1890ff",
  "#f56a00",
  "#87d068",
  "#1890ff",
  "#f56a00",
  "#87d068",
  "#1890ff",
];

function MultipleInputs() {
  const forceUpdate = useForceUpdate();
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<any>(d);

  const onChange = (patch: any) => {
    console.log("[onChange]", patch);
    forceUpdate();
  };

  const load = async () => {
    setLoaded(false);
    await SyncManager.init();
    const data = await SyncManager.create({
      data: d,
      collectionName: "MultiInputs",
      onChange,
      refid: "sample-testing-23",
    });
    setData(data);
    console.log("loaded data", data);
    setLoaded(true);
  };

  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");

  const changeVal = () => {
    data.value += 1;
    forceUpdate();
  };

  const changeSliderVal = (value: any) => {
    data.slider = value;
    forceUpdate();
  };

  const changeRadioVal = (value: string) => {
    data.radio = value;
    forceUpdate();
  };

  const changeInputNumberVal = (value: number) => {
    data.inputNumber = value;
    forceUpdate();
  };

  const addTimelineValue = () => {
    data.timelineItems.push(data.timelineItems.length);
    forceUpdate();
  };

  const setFormField1 = (value: string) => {
    data.formField1 = value;
    forceUpdate();
  };

  const setFormField2 = (value: string) => {
    data.formField2 = value;
    forceUpdate();
  };

  React.useEffect(() => {
    load();
  }, []);

  if (!loaded) {
    return <div>Loading..</div>;
  }

  console.log(
    "[timelineitems]",
    data.timelineItems.map((val: any) => val),
    data.timelineItems
  );

  return (
    <div className="App">
      <div>
        <Button onClick={forceUpdate}>Force Update</Button>
      </div>
      <div>
        {/* <Avatar.Group>
          {Array(Math.floor(parseInt(data.peopleInRoom) / 2))
            .fill(0)
            .map((val: number, index: number) => (
              <Avatar style={{ backgroundColor: AVATAR_COLORS[index] }}>
                {index}
              </Avatar>
            ))}
        </Avatar.Group> */}
      </div>
      <Row>
        <Col span={8}>
          <Card title="Slider Input">
            <Slider
              defaultValue={data.slider}
              value={data.slider}
              min={0}
              max={100}
              onChange={changeSliderVal}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Select">
            <Radio.Group
              value={data.radio}
              buttonStyle="solid"
              onChange={(event) => {
                changeRadioVal(event.target.value);
              }}
            >
              <Radio.Button value="a">Hangzhou</Radio.Button>
              <Radio.Button value="b">Shanghai</Radio.Button>
              <Radio.Button value="c">Beijing</Radio.Button>
              <Radio.Button value="d">Chengdu</Radio.Button>
            </Radio.Group>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Counter">
            <InputNumber
              min={0}
              max={100}
              value={data.inputNumber}
              onChange={(val) => {
                changeInputNumberVal(val);
              }}
            />
          </Card>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Card title="Timeline">
            <Timeline>
              {data.timelineItems.map((item: string) => (
                <Timeline.Item>{item}</Timeline.Item>
              ))}
            </Timeline>
            <Button onClick={addTimelineValue}>Dispatch</Button>
          </Card>
        </Col>
        <Col span={12}>
          {/* <Card title="Live Form">
            <Form
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ maxWidth: 600 }}
              initialValues={{ remember: true }}
              autoComplete="off"
            >
              <Form.Item label="Name">
                <Input
                  value={data.formField1}
                  placeholder="Enter your name"
                  onChange={(event) => {
                    setFormField1(event.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item label="Address">
                <Input
                  value={data.formField2}
                  placeholder="Enter your address"
                  onChange={(event) => {
                    setFormField2(event.target.value);
                  }}
                />
              </Form.Item>
            </Form>
          </Card> */}
        </Col>
      </Row>
    </div>
  );
}

export default MultipleInputs;
