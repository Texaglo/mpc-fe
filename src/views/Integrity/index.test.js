import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { Integrity } from './index';
jest.mock('axios', () => ({get:jest.fn(),post:jest.fn()}));
const user='aaaaaaaaaaaaaaaaaaaaaaaa';
beforeEach(()=>{jest.clearAllMocks();axios.get.mockImplementation(path=>Promise.resolve({data:{body:path.includes('overview')?{openAlerts:1,openReports:0}:path.includes('/players/')?{profile:{userId:user,revision:0},identity:null,links:[],withdrawals:[]}:{items:[{_id:'alert1',rule:'uniform_action_timing',users:[user],status:'open',createdAt:'2026-09-18',evidence:{samples:35}}],total:1}}}));axios.post.mockResolvedValue({data:{body:{}}});});
test('displays review evidence without claiming proof and requires reasons',async()=>{
 render(<Integrity role="admin" permissions={[]} />);await screen.findByText('uniform action timing');
 expect(screen.getByText(/not proof of cheating/)).toBeTruthy();
 fireEvent.click(screen.getByText('reviewing'));expect((await screen.findByRole('alert')).textContent).toContain('audit reason');expect(axios.post).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Audit reason'),{target:{value:'Investigate action timing'}});fireEvent.click(screen.getByText('reviewing'));
 await waitFor(()=>expect(axios.post).toHaveBeenCalledWith('/integrity/alerts/alert1',{status:'reviewing',reason:'Investigate action timing'}));
});
test('read-only operator cannot change controls',async()=>{
 render(<Integrity role="sub_admin" permissions={['integrity.view']} />);await screen.findByText('uniform action timing');
 expect(screen.queryByText('Analyze recent hands')).toBeNull();expect(screen.queryByText('confirmed')).toBeNull();
 fireEvent.click(screen.getByText(user));await screen.findByText('No device identifier supplied by client',{exact:false});
 expect(screen.getByText('Save controls').closest('fieldset').disabled).toBe(true);
});
