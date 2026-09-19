import React from 'react';
import {render,screen} from '@testing-library/react';
import Evidence from './Evidence';
const item={rule:'complex_fixed_delay',playerDetails:[{id:'p',name:'Example player'}],evidence:{presentation:{summary:'Decisions had very little variation.',threshold:'30 decisions in 20 hands',window:{hands:20,actions:30},metrics:[{label:'mean ms',value:2500}],timing:{samples:30,meanMs:2500,medianMs:2500,p95Ms:2500,distribution:[{label:'2–5 s',count:30}]},handIds:['a:b'],examples:[{eventId:'e',handId:'a:b',userId:'p',action:'Call',street:'river',decisionMs:2500,potBefore:100,callAmount:70,committed:70}]}}};
test('shows readable measurements, player names and links to exact histories',()=>{
 render(<Evidence item={item} canReadHands/>);
 expect(screen.getByText('Decisions had very little variation.')).toBeTruthy();
 expect(screen.getByText(/Example player/)).toBeTruthy();
 expect(screen.getAllByRole('link',{hidden:true})[0].getAttribute('href')).toBe('#/home/hand-history?hand=a%3Ab');
 expect(screen.getAllByText(/30 decisions in 20 hands/).length).toBeGreaterThan(0);
});
test('history permissions are respected and old evidence is not presented as a complete investigation',()=>{
 const r=render(<Evidence item={item} canReadHands={false}/>);expect(screen.queryByRole('link',{hidden:true})).toBeNull();
 r.rerender(<Evidence item={{rule:'uniform_action_timing',evidence:{samples:35}}}/>);
 expect(screen.getByText(/older case contains a limited evidence snapshot/)).toBeTruthy();
});
