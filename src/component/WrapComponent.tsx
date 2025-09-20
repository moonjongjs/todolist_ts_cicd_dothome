import React from 'react';
import './scss/WrapComponent.scss';
import HeaderComponent from './wrap/HeaderComponent';
import FooterComponent from './wrap/FooterComponent';
import MainComponent from './wrap/MainComponent';

export default function WrapComponent() {
    return (
        <div id="wrap">
            <HeaderComponent />
            <MainComponent />
            <FooterComponent />
        </div>
    );
}