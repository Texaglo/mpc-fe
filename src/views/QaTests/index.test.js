import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { QaTests } from './index';
jest.mock('axios', () => ({get:jest.fn(),post:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();axios.get.mockImplementation(p=>Promise.resolve({data:{body:p.endsWith('qa-options')?{enabled:true,presets:{heads_up:{label:'Heads-up natural splits'}}}:[]}}));axios.post.mockResolvedValue({data:{body:{}}});});
test('starts bounded real-game preset with audit reason and no cards or existing table selection',async()=>{
 render(<QaTests role="admin" permissions={[]} />);await screen.findByText('Heads-up natural splits');
 fireEvent.change(screen.getByLabelText('Audit reason'),{target:{value:'Natural split acceptance'}});
 fireEvent.click(screen.getByText('Start safe test'));
 await waitFor(()=>expect(axios.post).toHaveBeenCalledWith('/admin/table-bot-runs/qa',{mode:'heads_up',maxHands:600,runSeconds:14400,reason:'Natural split acceptance'}));
});
test('server-disabled and read-only controls cannot start tests',async()=>{
 axios.get.mockImplementation(p=>Promise.resolve({data:{body:p.endsWith('qa-options')?{enabled:false,presets:{}}:[]}}));
 const view=render(<QaTests role="admin" permissions={[]} />);await screen.findByText(/Test presets are disabled/);expect(screen.getByText('Start safe test').disabled).toBe(true);
 view.unmount();render(<QaTests role="sub_admin" permissions={['bots.view']} />);await screen.findByText(/Test presets are disabled/);expect(screen.queryByText('Start safe test')).toBeNull();expect(axios.post).not.toHaveBeenCalled();
});
