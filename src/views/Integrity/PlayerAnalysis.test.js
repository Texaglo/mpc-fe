import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import axios from 'axios';
import PlayerAnalysis from './PlayerAnalysis';
jest.mock('axios',()=>({get:jest.fn(),post:jest.fn()}));
test('manual player analysis shows no solver score without a reference',async()=>{
 axios.get.mockResolvedValue({data:{body:null}});axios.post.mockResolvedValue({data:{body:{flags:[],window:{},summary:{hands:200,actions:800,complexDecisions:35,timing:{samples:0},solver:{status:'no_reference',matchedDecisions:0},cohorts:[]}}}});
 render(<PlayerAnalysis userId="a" manage canReadHands/>);
 fireEvent.click(screen.getByText("Analyze this player's history"));
 await waitFor(()=>expect(axios.post).toHaveBeenCalledWith('/integrity/players/a/analyse',{}));
 expect(await screen.findByText('No solver reference matched. GTO accuracy has not been measured.')).toBeTruthy();
 expect(screen.getByText(/200 hands/)).toBeTruthy();
});
