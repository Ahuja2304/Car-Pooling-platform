import React from 'react';
// import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as MdIcons from 'react-icons/md';

export const SidebarData = [
  {
    title: 'Dashboard',
    path: '/trip-history',
    icon: <AiIcons.AiOutlineDashboard />,
  },
  {
    title: 'Find Ride',
    path: '/ride',
    icon: <MdIcons.MdSearch />,
  },
  {
    title: 'Post Ride',
    path: '/drive',
    icon: <AiIcons.AiOutlinePlusSquare />,
  },
  {
    title: 'My Rides',
    path: '/active-trip',
    icon: <AiIcons.AiOutlineCar />,
  },
];
