import React from "react";
import "./App.css";
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
import { useSync } from "../hooks/useSync";

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

export function MultipleInputs() {
  const sync = useSync({
    data: d,
  });
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<any>(d);

  const load = async () => {
    setLoaded(false);
    const data = await sync.init("arandomroom1");
    setData(data);
    setLoaded(true);
  };

  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");

  const changeVal = () => {
    data.value += 1;
  };

  const changeSliderVal = (value: any) => {
    data.slider = value;
  };

  const changeRadioVal = (value: string) => {
    data.radio = value;
  };

  const changeInputNumberVal = (value: number) => {
    data.inputNumber = value;
  };

  const addTimelineValue = () => {
    data.timelineItems.push(data.timelineItems.length);
  };

  const setFormField1 = (value: string) => {
    data.formField1 = value;
  };

  const setFormField2 = (value: string) => {
    data.formField2 = value;
  };

  React.useEffect(() => {
    load();
  }, []);

  if (!loaded) {
    return <div>Loading..</div>;
  }

  return (
    <div className="App">
      {/* <div>
        <Button onClick={forceUpdate}>Force Update</Button>
      </div> */}
      <div></div>
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
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// export const MultipleInputs = () => {
//   return <></>;
// };
