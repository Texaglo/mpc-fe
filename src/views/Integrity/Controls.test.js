import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import axios from 'axios';
import Controls from './Controls';
jest.mock('axios',()=>({get:jest.fn(),post:jest.fn()}));
const data={scope:'staging',mutable:true,revision:2,scopeOptions:[],controls:[{key:'collusion',number:4,name:'Collusion',enabled:true,switchable:true,editable:true,effect:'Off stops collusion alerts.'},{key:'secure_cards',number:2,name:'Secure cards',enabled:true,switchable:false,editable:false,effect:'Cards remain private.'}]};
beforeEach(()=>{jest.clearAllMocks();axios.get.mockResolvedValue({data:{body:data}});axios.post.mockResolvedValue({});});
test('switch changes require explicit scope and reason, send revision, and cannot turn off card privacy',async()=>{
 render(<Controls role="admin" permissions={[]} />);expect(screen.queryByText('Save switches')).toBeNull();
 fireEvent.change(screen.getByLabelText('Switch scope'),{target:{value:'staging'}});await screen.findByLabelText('4. Collusion · On');
 expect(screen.getByLabelText('2. Secure cards · Always on').disabled).toBe(true);
 fireEvent.click(screen.getByLabelText('4. Collusion · On'));fireEvent.click(screen.getByText('Save switches'));
 expect((await screen.findByRole('alert')).textContent).toContain('reason');expect(axios.post).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Switch change reason'),{target:{value:'Compare detection with collusion off'}});fireEvent.click(screen.getByText('Save switches'));
 await waitFor(()=>expect(axios.post).toHaveBeenCalledWith('/integrity/controls',{scope:'staging',revision:2,changes:{collusion:false},reason:'Compare detection with collusion off'}));
 await screen.findByText(/Switches saved/);
});
test('read-only operators cannot change switches',async()=>{
 render(<Controls role="sub_admin" permissions={['integrity.view']} />);fireEvent.change(screen.getByLabelText('Switch scope'),{target:{value:'staging'}});await screen.findByLabelText('4. Collusion · On');
 expect(screen.getByLabelText('4. Collusion · On').disabled).toBe(true);expect(screen.queryByText('Save switches')).toBeNull();
});
