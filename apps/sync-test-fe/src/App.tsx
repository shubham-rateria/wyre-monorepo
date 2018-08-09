import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Sync } from "@sam98231/reactive";
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
import Card from "./components/Card";

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
}

const d = {
  refid: "react-test-refid-17",
  arr: [1, 2, 3],
  value: 0,
  text: "hello\n",
  slider: 20,
  radio: "a",
  inputNumber: 0,
  peopleInRoom: 1,
  timelineItems: [
    "Create a services site 2015-09-01",
    "Solve initial network problems 2015-09-01",
    "Technical testing 2015-09-01",
    "Network problems being solved 2015-09-01",
  ],
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

function App() {
  const forceUpdate = useForceUpdate();

  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");

  const changeVal = () => {
    data.data.value += 1;
    forceUpdate();
  };

  const changeSliderVal = (value: any) => {
    data.data.slider = value;
    forceUpdate();
  };

  const changeRadioVal = (value: string) => {
    data.data.radio = value;
    forceUpdate();
  };

  const changeInputNumberVal = (value: number) => {
    data.data.inputNumber = value;
    forceUpdate();
  };

  const addTimelineValue = () => {
    data.data.timelineItems.push("Network problems being solved 2015-09-01");
    forceUpdate();
  };

  const setFormField1 = (value: string) => {
    data.data.formField1 = value;
    forceUpdate();
  };

  const setFormField2 = (value: string) => {
    data.data.formField2 = value;
    forceUpdate();
  };

  const data = React.useMemo(
    () =>
      Sync(d, () => {
        forceUpdate();
      }),
    []
  );

  // const init = async () => {
  //   await data.sync();
  //   forceUpdate();
  // };

  React.useEffect(() => {
    // init();
  }, []);

  return (
    <div className="App">
      <div>
        <Avatar.Group>
          {Array(Math.floor(parseInt(data.data.peopleInRoom) / 2))
            .fill(0)
            .map((val: number, index: number) => (
              <Avatar style={{ backgroundColor: AVATAR_COLORS[index] }}>
                {index}
              </Avatar>
            ))}
        </Avatar.Group>
      </div>
      <Row>
        <Col span={8}>
          <Card title="Slider Input">
            <Slider
              defaultValue={data.data.slider}
              value={data.data.slider}
              min={0}
              max={100}
              onChange={changeSliderVal}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Select">
            <Radio.Group
              value={data.data.radio}
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
              value={data.data.inputNumber}
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
            {/* <Timeline>
              {data.data.timelineItems.map((item: string) => (
                <Timeline.Item>{item}</Timeline.Item>
              ))}
            </Timeline> */}
            {/* <Button onClick={addTimelineValue}>Dispatch</Button> */}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Live Form">
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
                  value={data.data.formField1}
                  placeholder="Enter your name"
                  onChange={(event) => {
                    setFormField1(event.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item label="Address">
                <Input
                  value={data.data.formField2}
                  placeholder="Enter your address"
                  onChange={(event) => {
                    setFormField2(event.target.value);
                  }}
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default App;
