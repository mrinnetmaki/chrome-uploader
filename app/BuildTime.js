import React from 'react';
import preval from 'preval.macro';


export const time = preval`module.exports = new Date().getTime()`;

export const dateString = new Date(time).toISOString().substr(0,10);

const BuildTime = <time dateTime={dateString}>{dateString}</time>;

export default BuildTime;
