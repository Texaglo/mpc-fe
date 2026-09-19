import React from 'react';
import {render,waitFor} from '@testing-library/react';
import axios from 'axios';
import HandHistory from './index';
jest.mock('axios',()=>({get:jest.fn()}));
const mockDispatch=jest.fn();
jest.mock('react-redux',()=>({useDispatch:()=>mockDispatch}));
jest.mock('eventing-bus',()=>({publish:jest.fn()}));
jest.mock('reactstrap',()=>({Modal:({isOpen,children})=>isOpen?<div>{children}</div>:null,ModalBody:({children})=><div>{children}</div>,ModalHeader:({children})=><div>{children}</div>}));
test.each(['ring:exact-hand','competition:aaaaaaaaaaaaaaaaaaaaaaaa:2'])('opens the exact hand from an evidence deep link: %s',async id=>{
 axios.get.mockResolvedValue({data:{body:{hands:[],movements:[]}}});
 render(<HandHistory location={{search:'?hand='+encodeURIComponent(id)}}/>);
 const expected=id.startsWith('competition:')?'/integrity/hands/':'/history/admin/hands/';
 await waitFor(()=>expect(axios.get).toHaveBeenCalledWith(expected+encodeURIComponent(id)));
});
