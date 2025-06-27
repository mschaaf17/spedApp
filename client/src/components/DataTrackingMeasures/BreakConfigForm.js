import React from 'react';
import { Form, InputNumber, Radio, Switch, Button } from 'antd';

const BreakConfigForm = ({
  breakSettings,
  isUnlimitedBreaks,
  setBreakSettings,
  setIsUnlimitedBreaks,
  handleSaveBreakSettings,
  student
}) => (
  <div className="breaks-config-section">
    <h4>Configure Break Settings</h4>
    <p>Set the rules for when and how {student?.firstName} can take breaks.</p>
    <Form layout="vertical" style={{ marginTop: 24 }}>
      <Form.Item label="Break Duration (minutes)">
        <InputNumber
          min={1}
          max={60}
          value={breakSettings.duration}
          onChange={value => setBreakSettings(prev => ({ ...prev, duration: value }))}
        />
      </Form.Item>
      <Form.Item label="Daily Break Limit">
        <Radio.Group
          value={isUnlimitedBreaks}
          onChange={e => setIsUnlimitedBreaks(e.target.value)}
        >
          <Radio value={true}>Unlimited</Radio>
          <Radio value={false}>Limited</Radio>
        </Radio.Group>
        {!isUnlimitedBreaks && (
          <InputNumber
            min={1}
            max={10}
            value={breakSettings.dailyLimit}
            onChange={value => setBreakSettings(prev => ({ ...prev, dailyLimit: value }))}
            style={{ marginLeft: 16 }}
          />
        )}
      </Form.Item>
      <Form.Item label="Enable Delay Between Breaks">
        <Switch
          checked={breakSettings.hasDelay}
          onChange={checked => setBreakSettings(prev => ({ ...prev, hasDelay: checked }))}
        />
      </Form.Item>
      {breakSettings.hasDelay && (
        <Form.Item label="Delay Duration (minutes)">
          <InputNumber
            min={1}
            max={120}
            value={breakSettings.delayDuration}
            onChange={value => setBreakSettings(prev => ({ ...prev, delayDuration: value }))}
          />
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" onClick={handleSaveBreakSettings}>
          Save Break Settings
        </Button>
      </Form.Item>
    </Form>
  </div>
);

export default BreakConfigForm; 