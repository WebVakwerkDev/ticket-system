import{B as oe,h as a,c as u,b as s,A as c,C as de,D as p,E as I,F as k,t as y,e as P,G as fe,p as me,H as S,x as g,q as w,T as pe,r as F,_ as ge,I as be,J as v,K as R,L as $,n as C,M as B,d as ye,j as he,N as ve,u as A,f as Ce,g as _,O as we,m as ke}from"./index-BCSlcbH7.js";import{s as W,a as Ie,R as Se,b as je,c as X,f as re,x as z}from"./index-BRj424VB.js";import{s as Q}from"./index-DoohFz4m.js";import{a as xe,s as Ae}from"./index-CWoWJakZ.js";var Pe=`
    .p-toast {
        width: dt('toast.width');
        white-space: pre-line;
        word-break: break-word;
    }

    .p-toast-message {
        margin: 0 0 1rem 0;
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-toast-message-icon {
        flex-shrink: 0;
        font-size: dt('toast.icon.size');
        width: dt('toast.icon.size');
        height: dt('toast.icon.size');
    }

    .p-toast-message-content {
        display: flex;
        align-items: flex-start;
        padding: dt('toast.content.padding');
        gap: dt('toast.content.gap');
        min-height: 0;
        overflow: hidden;
        transition: padding 250ms ease-in;
    }

    .p-toast-message-text {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: dt('toast.text.gap');
    }

    .p-toast-summary {
        font-weight: dt('toast.summary.font.weight');
        font-size: dt('toast.summary.font.size');
    }

    .p-toast-detail {
        font-weight: dt('toast.detail.font.weight');
        font-size: dt('toast.detail.font.size');
    }

    .p-toast-close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        background: transparent;
        transition:
            background dt('toast.transition.duration'),
            color dt('toast.transition.duration'),
            outline-color dt('toast.transition.duration'),
            box-shadow dt('toast.transition.duration');
        outline-color: transparent;
        color: inherit;
        width: dt('toast.close.button.width');
        height: dt('toast.close.button.height');
        border-radius: dt('toast.close.button.border.radius');
        margin: -25% 0 0 0;
        right: -25%;
        padding: 0;
        border: none;
        user-select: none;
    }

    .p-toast-close-button:dir(rtl) {
        margin: -25% 0 0 auto;
        left: -25%;
        right: auto;
    }

    .p-toast-message-info,
    .p-toast-message-success,
    .p-toast-message-warn,
    .p-toast-message-error,
    .p-toast-message-secondary,
    .p-toast-message-contrast {
        border-width: dt('toast.border.width');
        border-style: solid;
        backdrop-filter: blur(dt('toast.blur'));
        border-radius: dt('toast.border.radius');
    }

    .p-toast-close-icon {
        font-size: dt('toast.close.icon.size');
        width: dt('toast.close.icon.size');
        height: dt('toast.close.icon.size');
    }

    .p-toast-close-button:focus-visible {
        outline-width: dt('focus.ring.width');
        outline-style: dt('focus.ring.style');
        outline-offset: dt('focus.ring.offset');
    }

    .p-toast-message-info {
        background: dt('toast.info.background');
        border-color: dt('toast.info.border.color');
        color: dt('toast.info.color');
        box-shadow: dt('toast.info.shadow');
    }

    .p-toast-message-info .p-toast-detail {
        color: dt('toast.info.detail.color');
    }

    .p-toast-message-info .p-toast-close-button:focus-visible {
        outline-color: dt('toast.info.close.button.focus.ring.color');
        box-shadow: dt('toast.info.close.button.focus.ring.shadow');
    }

    .p-toast-message-info .p-toast-close-button:hover {
        background: dt('toast.info.close.button.hover.background');
    }

    .p-toast-message-success {
        background: dt('toast.success.background');
        border-color: dt('toast.success.border.color');
        color: dt('toast.success.color');
        box-shadow: dt('toast.success.shadow');
    }

    .p-toast-message-success .p-toast-detail {
        color: dt('toast.success.detail.color');
    }

    .p-toast-message-success .p-toast-close-button:focus-visible {
        outline-color: dt('toast.success.close.button.focus.ring.color');
        box-shadow: dt('toast.success.close.button.focus.ring.shadow');
    }

    .p-toast-message-success .p-toast-close-button:hover {
        background: dt('toast.success.close.button.hover.background');
    }

    .p-toast-message-warn {
        background: dt('toast.warn.background');
        border-color: dt('toast.warn.border.color');
        color: dt('toast.warn.color');
        box-shadow: dt('toast.warn.shadow');
    }

    .p-toast-message-warn .p-toast-detail {
        color: dt('toast.warn.detail.color');
    }

    .p-toast-message-warn .p-toast-close-button:focus-visible {
        outline-color: dt('toast.warn.close.button.focus.ring.color');
        box-shadow: dt('toast.warn.close.button.focus.ring.shadow');
    }

    .p-toast-message-warn .p-toast-close-button:hover {
        background: dt('toast.warn.close.button.hover.background');
    }

    .p-toast-message-error {
        background: dt('toast.error.background');
        border-color: dt('toast.error.border.color');
        color: dt('toast.error.color');
        box-shadow: dt('toast.error.shadow');
    }

    .p-toast-message-error .p-toast-detail {
        color: dt('toast.error.detail.color');
    }

    .p-toast-message-error .p-toast-close-button:focus-visible {
        outline-color: dt('toast.error.close.button.focus.ring.color');
        box-shadow: dt('toast.error.close.button.focus.ring.shadow');
    }

    .p-toast-message-error .p-toast-close-button:hover {
        background: dt('toast.error.close.button.hover.background');
    }

    .p-toast-message-secondary {
        background: dt('toast.secondary.background');
        border-color: dt('toast.secondary.border.color');
        color: dt('toast.secondary.color');
        box-shadow: dt('toast.secondary.shadow');
    }

    .p-toast-message-secondary .p-toast-detail {
        color: dt('toast.secondary.detail.color');
    }

    .p-toast-message-secondary .p-toast-close-button:focus-visible {
        outline-color: dt('toast.secondary.close.button.focus.ring.color');
        box-shadow: dt('toast.secondary.close.button.focus.ring.shadow');
    }

    .p-toast-message-secondary .p-toast-close-button:hover {
        background: dt('toast.secondary.close.button.hover.background');
    }

    .p-toast-message-contrast {
        background: dt('toast.contrast.background');
        border-color: dt('toast.contrast.border.color');
        color: dt('toast.contrast.color');
        box-shadow: dt('toast.contrast.shadow');
    }
    
    .p-toast-message-contrast .p-toast-detail {
        color: dt('toast.contrast.detail.color');
    }

    .p-toast-message-contrast .p-toast-close-button:focus-visible {
        outline-color: dt('toast.contrast.close.button.focus.ring.color');
        box-shadow: dt('toast.contrast.close.button.focus.ring.shadow');
    }

    .p-toast-message-contrast .p-toast-close-button:hover {
        background: dt('toast.contrast.close.button.hover.background');
    }

    .p-toast-top-center {
        transform: translateX(-50%);
    }

    .p-toast-bottom-center {
        transform: translateX(-50%);
    }

    .p-toast-center {
        min-width: 20vw;
        transform: translate(-50%, -50%);
    }

    .p-toast-message-enter-active {
        animation: p-animate-toast-enter 300ms ease-out;
    }

    .p-toast-message-leave-active {
        animation: p-animate-toast-leave 250ms ease-in;
    }

    .p-toast-message-leave-to .p-toast-message-content {
        padding-top: 0;
        padding-bottom: 0;
    }

    @keyframes p-animate-toast-enter {
        from {
            opacity: 0;
            transform: scale(0.6);
        }
        to {
            opacity: 1;
            grid-template-rows: 1fr;
        }
    }

     @keyframes p-animate-toast-leave {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
            margin-bottom: 0;
            grid-template-rows: 0fr;
            transform: translateY(-100%) scale(0.6);
        }
    }
`;function T(e){"@babel/helpers - typeof";return T=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},T(e)}function D(e,t,n){return(t=Te(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Te(e){var t=Ee(e,"string");return T(t)=="symbol"?t:t+""}function Ee(e,t){if(T(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(T(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var Oe={root:function(t){var n=t.position;return{position:"fixed",top:n==="top-right"||n==="top-left"||n==="top-center"?"20px":n==="center"?"50%":null,right:(n==="top-right"||n==="bottom-right")&&"20px",bottom:(n==="bottom-left"||n==="bottom-right"||n==="bottom-center")&&"20px",left:n==="top-left"||n==="bottom-left"?"20px":n==="center"||n==="top-center"||n==="bottom-center"?"50%":null}}},Me={root:function(t){var n=t.props;return["p-toast p-component p-toast-"+n.position]},message:function(t){var n=t.props;return["p-toast-message",{"p-toast-message-info":n.message.severity==="info"||n.message.severity===void 0,"p-toast-message-warn":n.message.severity==="warn","p-toast-message-error":n.message.severity==="error","p-toast-message-success":n.message.severity==="success","p-toast-message-secondary":n.message.severity==="secondary","p-toast-message-contrast":n.message.severity==="contrast"}]},messageContent:"p-toast-message-content",messageIcon:function(t){var n=t.props;return["p-toast-message-icon",D(D(D(D({},n.infoIcon,n.message.severity==="info"),n.warnIcon,n.message.severity==="warn"),n.errorIcon,n.message.severity==="error"),n.successIcon,n.message.severity==="success")]},messageText:"p-toast-message-text",summary:"p-toast-summary",detail:"p-toast-detail",closeButton:"p-toast-close-button",closeIcon:"p-toast-close-icon"},Le=oe.extend({name:"toast",style:Pe,classes:Me,inlineStyles:Oe}),Z={name:"ExclamationTriangleIcon",extends:W};function $e(e){return _e(e)||Re(e)||De(e)||Be()}function Be(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function De(e,t){if(e){if(typeof e=="string")return U(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?U(e,t):void 0}}function Re(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function _e(e){if(Array.isArray(e))return U(e)}function U(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}function ze(e,t,n,o,i,r){return a(),u("svg",c({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},e.pti()),$e(t[0]||(t[0]=[s("path",{d:"M13.4018 13.1893H0.598161C0.49329 13.189 0.390283 13.1615 0.299143 13.1097C0.208003 13.0578 0.131826 12.9832 0.0780112 12.8932C0.0268539 12.8015 0 12.6982 0 12.5931C0 12.4881 0.0268539 12.3848 0.0780112 12.293L6.47985 1.08982C6.53679 1.00399 6.61408 0.933574 6.70484 0.884867C6.7956 0.836159 6.897 0.810669 7 0.810669C7.103 0.810669 7.2044 0.836159 7.29516 0.884867C7.38592 0.933574 7.46321 1.00399 7.52015 1.08982L13.922 12.293C13.9731 12.3848 14 12.4881 14 12.5931C14 12.6982 13.9731 12.8015 13.922 12.8932C13.8682 12.9832 13.792 13.0578 13.7009 13.1097C13.6097 13.1615 13.5067 13.189 13.4018 13.1893ZM1.63046 11.989H12.3695L7 2.59425L1.63046 11.989Z",fill:"currentColor"},null,-1),s("path",{d:"M6.99996 8.78801C6.84143 8.78594 6.68997 8.72204 6.57787 8.60993C6.46576 8.49782 6.40186 8.34637 6.39979 8.18784V5.38703C6.39979 5.22786 6.46302 5.0752 6.57557 4.96265C6.68813 4.85009 6.84078 4.78686 6.99996 4.78686C7.15914 4.78686 7.31179 4.85009 7.42435 4.96265C7.5369 5.0752 7.60013 5.22786 7.60013 5.38703V8.18784C7.59806 8.34637 7.53416 8.49782 7.42205 8.60993C7.30995 8.72204 7.15849 8.78594 6.99996 8.78801Z",fill:"currentColor"},null,-1),s("path",{d:"M6.99996 11.1887C6.84143 11.1866 6.68997 11.1227 6.57787 11.0106C6.46576 10.8985 6.40186 10.7471 6.39979 10.5885V10.1884C6.39979 10.0292 6.46302 9.87658 6.57557 9.76403C6.68813 9.65147 6.84078 9.58824 6.99996 9.58824C7.15914 9.58824 7.31179 9.65147 7.42435 9.76403C7.5369 9.87658 7.60013 10.0292 7.60013 10.1884V10.5885C7.59806 10.7471 7.53416 10.8985 7.42205 11.0106C7.30995 11.1227 7.15849 11.1866 6.99996 11.1887Z",fill:"currentColor"},null,-1)])),16)}Z.render=ze;var N={name:"InfoCircleIcon",extends:W};function Fe(e){return He(e)||Ne(e)||Ue(e)||Ze()}function Ze(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Ue(e,t){if(e){if(typeof e=="string")return H(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?H(e,t):void 0}}function Ne(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function He(e){if(Array.isArray(e))return H(e)}function H(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}function Ve(e,t,n,o,i,r){return a(),u("svg",c({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},e.pti()),Fe(t[0]||(t[0]=[s("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M3.11101 12.8203C4.26215 13.5895 5.61553 14 7 14C8.85652 14 10.637 13.2625 11.9497 11.9497C13.2625 10.637 14 8.85652 14 7C14 5.61553 13.5895 4.26215 12.8203 3.11101C12.0511 1.95987 10.9579 1.06266 9.67879 0.532846C8.3997 0.00303296 6.99224 -0.13559 5.63437 0.134506C4.2765 0.404603 3.02922 1.07129 2.05026 2.05026C1.07129 3.02922 0.404603 4.2765 0.134506 5.63437C-0.13559 6.99224 0.00303296 8.3997 0.532846 9.67879C1.06266 10.9579 1.95987 12.0511 3.11101 12.8203ZM3.75918 2.14976C4.71846 1.50879 5.84628 1.16667 7 1.16667C8.5471 1.16667 10.0308 1.78125 11.1248 2.87521C12.2188 3.96918 12.8333 5.45291 12.8333 7C12.8333 8.15373 12.4912 9.28154 11.8502 10.2408C11.2093 11.2001 10.2982 11.9478 9.23232 12.3893C8.16642 12.8308 6.99353 12.9463 5.86198 12.7212C4.73042 12.4962 3.69102 11.9406 2.87521 11.1248C2.05941 10.309 1.50384 9.26958 1.27876 8.13803C1.05367 7.00647 1.16919 5.83358 1.61071 4.76768C2.05222 3.70178 2.79989 2.79074 3.75918 2.14976ZM7.00002 4.8611C6.84594 4.85908 6.69873 4.79698 6.58977 4.68801C6.48081 4.57905 6.4187 4.43185 6.41669 4.27776V3.88888C6.41669 3.73417 6.47815 3.58579 6.58754 3.4764C6.69694 3.367 6.84531 3.30554 7.00002 3.30554C7.15473 3.30554 7.3031 3.367 7.4125 3.4764C7.52189 3.58579 7.58335 3.73417 7.58335 3.88888V4.27776C7.58134 4.43185 7.51923 4.57905 7.41027 4.68801C7.30131 4.79698 7.1541 4.85908 7.00002 4.8611ZM7.00002 10.6945C6.84594 10.6925 6.69873 10.6304 6.58977 10.5214C6.48081 10.4124 6.4187 10.2652 6.41669 10.1111V6.22225C6.41669 6.06754 6.47815 5.91917 6.58754 5.80977C6.69694 5.70037 6.84531 5.63892 7.00002 5.63892C7.15473 5.63892 7.3031 5.70037 7.4125 5.80977C7.52189 5.91917 7.58335 6.06754 7.58335 6.22225V10.1111C7.58134 10.2652 7.51923 10.4124 7.41027 10.5214C7.30131 10.6304 7.1541 10.6925 7.00002 10.6945Z",fill:"currentColor"},null,-1)])),16)}N.render=Ve;var V={name:"TimesCircleIcon",extends:W};function Ke(e){return Ye(e)||Xe(e)||We(e)||Ge()}function Ge(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function We(e,t){if(e){if(typeof e=="string")return K(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?K(e,t):void 0}}function Xe(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function Ye(e){if(Array.isArray(e))return K(e)}function K(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}function qe(e,t,n,o,i,r){return a(),u("svg",c({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},e.pti()),Ke(t[0]||(t[0]=[s("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M7 14C5.61553 14 4.26215 13.5895 3.11101 12.8203C1.95987 12.0511 1.06266 10.9579 0.532846 9.67879C0.00303296 8.3997 -0.13559 6.99224 0.134506 5.63437C0.404603 4.2765 1.07129 3.02922 2.05026 2.05026C3.02922 1.07129 4.2765 0.404603 5.63437 0.134506C6.99224 -0.13559 8.3997 0.00303296 9.67879 0.532846C10.9579 1.06266 12.0511 1.95987 12.8203 3.11101C13.5895 4.26215 14 5.61553 14 7C14 8.85652 13.2625 10.637 11.9497 11.9497C10.637 13.2625 8.85652 14 7 14ZM7 1.16667C5.84628 1.16667 4.71846 1.50879 3.75918 2.14976C2.79989 2.79074 2.05222 3.70178 1.61071 4.76768C1.16919 5.83358 1.05367 7.00647 1.27876 8.13803C1.50384 9.26958 2.05941 10.309 2.87521 11.1248C3.69102 11.9406 4.73042 12.4962 5.86198 12.7212C6.99353 12.9463 8.16642 12.8308 9.23232 12.3893C10.2982 11.9478 11.2093 11.2001 11.8502 10.2408C12.4912 9.28154 12.8333 8.15373 12.8333 7C12.8333 5.45291 12.2188 3.96918 11.1248 2.87521C10.0308 1.78125 8.5471 1.16667 7 1.16667ZM4.66662 9.91668C4.58998 9.91704 4.51404 9.90209 4.44325 9.87271C4.37246 9.84333 4.30826 9.8001 4.2544 9.74557C4.14516 9.6362 4.0838 9.48793 4.0838 9.33335C4.0838 9.17876 4.14516 9.0305 4.2544 8.92113L6.17553 7L4.25443 5.07891C4.15139 4.96832 4.09529 4.82207 4.09796 4.67094C4.10063 4.51982 4.16185 4.37563 4.26872 4.26876C4.3756 4.16188 4.51979 4.10066 4.67091 4.09799C4.82204 4.09532 4.96829 4.15142 5.07887 4.25446L6.99997 6.17556L8.92106 4.25446C9.03164 4.15142 9.1779 4.09532 9.32903 4.09799C9.48015 4.10066 9.62434 4.16188 9.73121 4.26876C9.83809 4.37563 9.89931 4.51982 9.90198 4.67094C9.90464 4.82207 9.84855 4.96832 9.74551 5.07891L7.82441 7L9.74554 8.92113C9.85478 9.0305 9.91614 9.17876 9.91614 9.33335C9.91614 9.48793 9.85478 9.6362 9.74554 9.74557C9.69168 9.8001 9.62748 9.84333 9.55669 9.87271C9.4859 9.90209 9.40996 9.91704 9.33332 9.91668C9.25668 9.91704 9.18073 9.90209 9.10995 9.87271C9.03916 9.84333 8.97495 9.8001 8.9211 9.74557L6.99997 7.82444L5.07884 9.74557C5.02499 9.8001 4.96078 9.84333 4.88999 9.87271C4.81921 9.90209 4.74326 9.91704 4.66662 9.91668Z",fill:"currentColor"},null,-1)])),16)}V.render=qe;var Je={name:"BaseToast",extends:X,props:{group:{type:String,default:null},position:{type:String,default:"top-right"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},breakpoints:{type:Object,default:null},closeIcon:{type:String,default:void 0},infoIcon:{type:String,default:void 0},warnIcon:{type:String,default:void 0},errorIcon:{type:String,default:void 0},successIcon:{type:String,default:void 0},closeButtonProps:{type:null,default:null},onMouseEnter:{type:Function,default:void 0},onMouseLeave:{type:Function,default:void 0},onClick:{type:Function,default:void 0}},style:Le,provide:function(){return{$pcToast:this,$parentInstance:this}}};function E(e){"@babel/helpers - typeof";return E=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},E(e)}function Qe(e,t,n){return(t=et(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function et(e){var t=tt(e,"string");return E(t)=="symbol"?t:t+""}function tt(e,t){if(E(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(E(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var se={name:"ToastMessage",hostName:"Toast",extends:X,emits:["close"],closeTimeout:null,createdAt:null,lifeRemaining:null,props:{message:{type:null,default:null},templates:{type:Object,default:null},closeIcon:{type:String,default:null},infoIcon:{type:String,default:null},warnIcon:{type:String,default:null},errorIcon:{type:String,default:null},successIcon:{type:String,default:null},closeButtonProps:{type:null,default:null},onMouseEnter:{type:Function,default:void 0},onMouseLeave:{type:Function,default:void 0},onClick:{type:Function,default:void 0}},mounted:function(){this.message.life&&(this.lifeRemaining=this.message.life,this.startTimeout())},beforeUnmount:function(){this.clearCloseTimeout()},methods:{startTimeout:function(){var t=this;this.createdAt=new Date().valueOf(),this.closeTimeout=setTimeout(function(){t.close({message:t.message,type:"life-end"})},this.lifeRemaining)},close:function(t){this.$emit("close",t)},onCloseClick:function(){this.clearCloseTimeout(),this.close({message:this.message,type:"close"})},clearCloseTimeout:function(){this.closeTimeout&&(clearTimeout(this.closeTimeout),this.closeTimeout=null)},onMessageClick:function(t){var n;(n=this.onClick)===null||n===void 0||n.call(this,{originalEvent:t,message:this.message})},handleMouseEnter:function(t){if(this.onMouseEnter){if(this.onMouseEnter({originalEvent:t,message:this.message}),t.defaultPrevented)return;this.message.life&&(this.lifeRemaining=this.createdAt+this.lifeRemaining-new Date().valueOf(),this.createdAt=null,this.clearCloseTimeout())}},handleMouseLeave:function(t){if(this.onMouseLeave){if(this.onMouseLeave({originalEvent:t,message:this.message}),t.defaultPrevented)return;this.message.life&&this.startTimeout()}}},computed:{iconComponent:function(){return{info:!this.infoIcon&&N,success:!this.successIcon&&Q,warn:!this.warnIcon&&Z,error:!this.errorIcon&&V}[this.message.severity]},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return re(Qe({},this.message.severity,this.message.severity))}},components:{TimesIcon:je,InfoCircleIcon:N,CheckIcon:Q,ExclamationTriangleIcon:Z,TimesCircleIcon:V},directives:{ripple:Se}};function O(e){"@babel/helpers - typeof";return O=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},O(e)}function ee(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),n.push.apply(n,o)}return n}function te(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?ee(Object(n),!0).forEach(function(o){nt(e,o,n[o])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):ee(Object(n)).forEach(function(o){Object.defineProperty(e,o,Object.getOwnPropertyDescriptor(n,o))})}return e}function nt(e,t,n){return(t=ot(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function ot(e){var t=rt(e,"string");return O(t)=="symbol"?t:t+""}function rt(e,t){if(O(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(O(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var st=["data-p"],at=["data-p"],it=["data-p"],lt=["data-p"],ct=["aria-label","data-p"];function ut(e,t,n,o,i,r){var h=de("ripple");return a(),u("div",c({class:[e.cx("message"),n.message.styleClass],role:"alert","aria-live":"assertive","aria-atomic":"true","data-p":r.dataP},e.ptm("message"),{onClick:t[1]||(t[1]=function(){return r.onMessageClick&&r.onMessageClick.apply(r,arguments)}),onMouseenter:t[2]||(t[2]=function(){return r.handleMouseEnter&&r.handleMouseEnter.apply(r,arguments)}),onMouseleave:t[3]||(t[3]=function(){return r.handleMouseLeave&&r.handleMouseLeave.apply(r,arguments)})}),[n.templates.container?(a(),p(I(n.templates.container),{key:0,message:n.message,closeCallback:r.onCloseClick},null,8,["message","closeCallback"])):(a(),u("div",c({key:1,class:[e.cx("messageContent"),n.message.contentStyleClass]},e.ptm("messageContent")),[n.templates.message?(a(),p(I(n.templates.message),{key:1,message:n.message},null,8,["message"])):(a(),u(k,{key:0},[(a(),p(I(n.templates.messageicon?n.templates.messageicon:n.templates.icon?n.templates.icon:r.iconComponent&&r.iconComponent.name?r.iconComponent:"span"),c({class:e.cx("messageIcon")},e.ptm("messageIcon")),null,16,["class"])),s("div",c({class:e.cx("messageText"),"data-p":r.dataP},e.ptm("messageText")),[s("span",c({class:e.cx("summary"),"data-p":r.dataP},e.ptm("summary")),y(n.message.summary),17,it),n.message.detail?(a(),u("div",c({key:0,class:e.cx("detail"),"data-p":r.dataP},e.ptm("detail")),y(n.message.detail),17,lt)):P("",!0)],16,at)],64)),n.message.closable!==!1?(a(),u("div",fe(c({key:2},e.ptm("buttonContainer"))),[me((a(),u("button",c({class:e.cx("closeButton"),type:"button","aria-label":r.closeAriaLabel,onClick:t[0]||(t[0]=function(){return r.onCloseClick&&r.onCloseClick.apply(r,arguments)}),autofocus:"","data-p":r.dataP},te(te({},n.closeButtonProps),e.ptm("closeButton"))),[(a(),p(I(n.templates.closeicon||"TimesIcon"),c({class:[e.cx("closeIcon"),n.closeIcon]},e.ptm("closeIcon")),null,16,["class"]))],16,ct)),[[h]])],16)):P("",!0)],16))],16,st)}se.render=ut;function M(e){"@babel/helpers - typeof";return M=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},M(e)}function dt(e,t,n){return(t=ft(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function ft(e){var t=mt(e,"string");return M(t)=="symbol"?t:t+""}function mt(e,t){if(M(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(M(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function pt(e){return ht(e)||yt(e)||bt(e)||gt()}function gt(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function bt(e,t){if(e){if(typeof e=="string")return G(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?G(e,t):void 0}}function yt(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function ht(e){if(Array.isArray(e))return G(e)}function G(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,o=Array(t);n<t;n++)o[n]=e[n];return o}var vt=0,ae={name:"Toast",extends:Je,inheritAttrs:!1,emits:["close","life-end"],data:function(){return{messages:[]}},styleElement:null,mounted:function(){v.on("add",this.onAdd),v.on("remove",this.onRemove),v.on("remove-group",this.onRemoveGroup),v.on("remove-all-groups",this.onRemoveAllGroups),this.breakpoints&&this.createStyle()},beforeUnmount:function(){this.destroyStyle(),this.$refs.container&&this.autoZIndex&&z.clear(this.$refs.container),v.off("add",this.onAdd),v.off("remove",this.onRemove),v.off("remove-group",this.onRemoveGroup),v.off("remove-all-groups",this.onRemoveAllGroups)},methods:{add:function(t){t.id==null&&(t.id=vt++),this.messages=[].concat(pt(this.messages),[t])},remove:function(t){var n=this.messages.findIndex(function(o){return o.id===t.message.id});n!==-1&&(this.messages.splice(n,1),this.$emit(t.type,{message:t.message}))},onAdd:function(t){this.group==t.group&&this.add(t)},onRemove:function(t){this.remove({message:t,type:"close"})},onRemoveGroup:function(t){this.group===t&&(this.messages=[])},onRemoveAllGroups:function(){var t=this;this.messages.forEach(function(n){return t.$emit("close",{message:n})}),this.messages=[]},onEnter:function(){this.autoZIndex&&z.set("modal",this.$refs.container,this.baseZIndex||this.$primevue.config.zIndex.modal)},onLeave:function(){var t=this;this.$refs.container&&this.autoZIndex&&be(this.messages)&&setTimeout(function(){z.clear(t.$refs.container)},200)},createStyle:function(){if(!this.styleElement&&!this.isUnstyled){var t;this.styleElement=document.createElement("style"),this.styleElement.type="text/css",ge(this.styleElement,"nonce",(t=this.$primevue)===null||t===void 0||(t=t.config)===null||t===void 0||(t=t.csp)===null||t===void 0?void 0:t.nonce),document.head.appendChild(this.styleElement);var n="";for(var o in this.breakpoints){var i="";for(var r in this.breakpoints[o])i+=r+":"+this.breakpoints[o][r]+"!important;";n+=`
                        @media screen and (max-width: `.concat(o,`) {
                            .p-toast[`).concat(this.$attrSelector,`] {
                                `).concat(i,`
                            }
                        }
                    `)}this.styleElement.innerHTML=n}},destroyStyle:function(){this.styleElement&&(document.head.removeChild(this.styleElement),this.styleElement=null)}},computed:{dataP:function(){return re(dt({},this.position,this.position))}},components:{ToastMessage:se,Portal:Ie}};function L(e){"@babel/helpers - typeof";return L=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},L(e)}function ne(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),n.push.apply(n,o)}return n}function Ct(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?ne(Object(n),!0).forEach(function(o){wt(e,o,n[o])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):ne(Object(n)).forEach(function(o){Object.defineProperty(e,o,Object.getOwnPropertyDescriptor(n,o))})}return e}function wt(e,t,n){return(t=kt(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function kt(e){var t=It(e,"string");return L(t)=="symbol"?t:t+""}function It(e,t){if(L(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var o=n.call(e,t);if(L(o)!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}var St=["data-p"];function jt(e,t,n,o,i,r){var h=S("ToastMessage"),j=S("Portal");return a(),p(j,null,{default:g(function(){return[s("div",c({ref:"container",class:e.cx("root"),style:e.sx("root",!0,{position:e.position}),"data-p":r.dataP},e.ptmi("root")),[w(pe,c({name:"p-toast-message",tag:"div",onEnter:r.onEnter,onLeave:r.onLeave},Ct({},e.ptm("transition"))),{default:g(function(){return[(a(!0),u(k,null,F(i.messages,function(m){return a(),p(h,{key:m.id,message:m,templates:e.$slots,closeIcon:e.closeIcon,infoIcon:e.infoIcon,warnIcon:e.warnIcon,errorIcon:e.errorIcon,successIcon:e.successIcon,closeButtonProps:e.closeButtonProps,onMouseEnter:e.onMouseEnter,onMouseLeave:e.onMouseLeave,onClick:e.onClick,unstyled:e.unstyled,onClose:t[0]||(t[0]=function(b){return r.remove(b)}),pt:e.pt},null,8,["message","templates","closeIcon","infoIcon","warnIcon","errorIcon","successIcon","closeButtonProps","onMouseEnter","onMouseLeave","onClick","unstyled","pt"])}),128))]}),_:1},16,["onEnter","onLeave"])],16,St)]}),_:1})}ae.render=jt;var xt=`
    .p-confirmdialog .p-dialog-content {
        display: flex;
        align-items: center;
        gap: dt('confirmdialog.content.gap');
    }

    .p-confirmdialog-icon {
        color: dt('confirmdialog.icon.color');
        font-size: dt('confirmdialog.icon.size');
        width: dt('confirmdialog.icon.size');
        height: dt('confirmdialog.icon.size');
    }
`,At={root:"p-confirmdialog",icon:"p-confirmdialog-icon",message:"p-confirmdialog-message",pcRejectButton:"p-confirmdialog-reject-button",pcAcceptButton:"p-confirmdialog-accept-button"},Pt=oe.extend({name:"confirmdialog",style:xt,classes:At}),Tt={name:"BaseConfirmDialog",extends:X,props:{group:String,breakpoints:{type:Object,default:null},draggable:{type:Boolean,default:!0}},style:Pt,provide:function(){return{$pcConfirmDialog:this,$parentInstance:this}}},ie={name:"ConfirmDialog",extends:Tt,confirmListener:null,closeListener:null,data:function(){return{visible:!1,confirmation:null}},mounted:function(){var t=this;this.confirmListener=function(n){n&&n.group===t.group&&(t.confirmation=n,t.confirmation.onShow&&t.confirmation.onShow(),t.visible=!0)},this.closeListener=function(){t.visible=!1,t.confirmation=null},B.on("confirm",this.confirmListener),B.on("close",this.closeListener)},beforeUnmount:function(){B.off("confirm",this.confirmListener),B.off("close",this.closeListener)},methods:{accept:function(){this.confirmation.accept&&this.confirmation.accept(),this.visible=!1},reject:function(){this.confirmation.reject&&this.confirmation.reject(),this.visible=!1},onHide:function(){this.confirmation.onHide&&this.confirmation.onHide(),this.visible=!1}},computed:{appendTo:function(){return this.confirmation?this.confirmation.appendTo:"body"},target:function(){return this.confirmation?this.confirmation.target:null},modal:function(){return this.confirmation?this.confirmation.modal==null?!0:this.confirmation.modal:!0},header:function(){return this.confirmation?this.confirmation.header:null},message:function(){return this.confirmation?this.confirmation.message:null},blockScroll:function(){return this.confirmation?this.confirmation.blockScroll:!0},position:function(){return this.confirmation?this.confirmation.position:null},acceptLabel:function(){if(this.confirmation){var t,n=this.confirmation;return n.acceptLabel||((t=n.acceptProps)===null||t===void 0?void 0:t.label)||this.$primevue.config.locale.accept}return this.$primevue.config.locale.accept},rejectLabel:function(){if(this.confirmation){var t,n=this.confirmation;return n.rejectLabel||((t=n.rejectProps)===null||t===void 0?void 0:t.label)||this.$primevue.config.locale.reject}return this.$primevue.config.locale.reject},acceptIcon:function(){var t;return this.confirmation?this.confirmation.acceptIcon:(t=this.confirmation)!==null&&t!==void 0&&t.acceptProps?this.confirmation.acceptProps.icon:null},rejectIcon:function(){var t;return this.confirmation?this.confirmation.rejectIcon:(t=this.confirmation)!==null&&t!==void 0&&t.rejectProps?this.confirmation.rejectProps.icon:null},autoFocusAccept:function(){return this.confirmation.defaultFocus===void 0||this.confirmation.defaultFocus==="accept"},autoFocusReject:function(){return this.confirmation.defaultFocus==="reject"},closeOnEscape:function(){return this.confirmation?this.confirmation.closeOnEscape:!0}},components:{Dialog:Ae,Button:xe}};function Et(e,t,n,o,i,r){var h=S("Button"),j=S("Dialog");return a(),p(j,{visible:i.visible,"onUpdate:visible":[t[2]||(t[2]=function(m){return i.visible=m}),r.onHide],role:"alertdialog",class:C(e.cx("root")),modal:r.modal,header:r.header,blockScroll:r.blockScroll,appendTo:r.appendTo,position:r.position,breakpoints:e.breakpoints,closeOnEscape:r.closeOnEscape,draggable:e.draggable,pt:e.pt,unstyled:e.unstyled},R({default:g(function(){return[e.$slots.container?P("",!0):(a(),u(k,{key:0},[e.$slots.message?(a(),p(I(e.$slots.message),{key:1,message:i.confirmation},null,8,["message"])):(a(),u(k,{key:0},[$(e.$slots,"icon",{},function(){return[e.$slots.icon?(a(),p(I(e.$slots.icon),{key:0,class:C(e.cx("icon"))},null,8,["class"])):i.confirmation.icon?(a(),u("span",c({key:1,class:[i.confirmation.icon,e.cx("icon")]},e.ptm("icon")),null,16)):P("",!0)]}),s("span",c({class:e.cx("message")},e.ptm("message")),y(r.message),17)],64))],64))]}),_:2},[e.$slots.container?{name:"container",fn:g(function(m){return[$(e.$slots,"container",{message:i.confirmation,closeCallback:m.closeCallback,acceptCallback:r.accept,rejectCallback:r.reject,initDragCallback:m.initDragCallback})]}),key:"0"}:void 0,e.$slots.container?void 0:{name:"footer",fn:g(function(){var m;return[w(h,c({class:[e.cx("pcRejectButton"),i.confirmation.rejectClass],autofocus:r.autoFocusReject,unstyled:e.unstyled,text:((m=i.confirmation.rejectProps)===null||m===void 0?void 0:m.text)||!1,onClick:t[0]||(t[0]=function(b){return r.reject()})},i.confirmation.rejectProps,{label:r.rejectLabel,pt:e.ptm("pcRejectButton")}),R({_:2},[r.rejectIcon||e.$slots.rejecticon?{name:"icon",fn:g(function(b){return[$(e.$slots,"rejecticon",{},function(){return[s("span",c({class:[r.rejectIcon,b.class]},e.ptm("pcRejectButton").icon,{"data-pc-section":"rejectbuttonicon"}),null,16)]})]}),key:"0"}:void 0]),1040,["class","autofocus","unstyled","text","label","pt"]),w(h,c({label:r.acceptLabel,class:[e.cx("pcAcceptButton"),i.confirmation.acceptClass],autofocus:r.autoFocusAccept,unstyled:e.unstyled,onClick:t[1]||(t[1]=function(b){return r.accept()})},i.confirmation.acceptProps,{pt:e.ptm("pcAcceptButton")}),R({_:2},[r.acceptIcon||e.$slots.accepticon?{name:"icon",fn:g(function(b){return[$(e.$slots,"accepticon",{},function(){return[s("span",c({class:[r.acceptIcon,b.class]},e.ptm("pcAcceptButton").icon,{"data-pc-section":"acceptbuttonicon"}),null,16)]})]}),key:"0"}:void 0]),1040,["label","class","autofocus","unstyled","pt"])]}),key:"1"}]),1032,["visible","class","modal","header","blockScroll","appendTo","position","breakpoints","closeOnEscape","draggable","onUpdate:visible","pt","unstyled"])}ie.render=Et;const Ot={class:"flex h-screen overflow-hidden bg-gray-50"},Mt={class:"h-14 flex items-center px-4 border-b border-gray-200 shrink-0"},Lt={class:"flex-1 py-3 px-2 space-y-0.5 overflow-y-auto"},$t={key:0,class:"absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 rounded-r"},Bt={class:"p-2 border-t border-gray-200 shrink-0"},Dt={class:"w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-mono font-medium text-gray-600 shrink-0"},Rt={class:"text-xs font-medium text-gray-700 truncate"},_t={class:"text-[10px] text-gray-400 font-mono"},zt={class:"flex-1 flex flex-col overflow-hidden"},Ft={class:"h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0"},Zt={class:"flex items-center gap-2 text-sm"},Ut={key:1,class:"text-gray-900 font-medium"},Nt={class:"flex-1 overflow-y-auto"},Ht={class:"p-6 animate-fade-in"},Xt=ye({__name:"AppLayout",setup(e){const t=he(),n=we(),o=Ce(!1),i=[{to:"/",label:"Dashboard",icon:"pi pi-objects-column",roles:["ADMIN","EMPLOYEE"],order:0}],r={to:"/settings",label:"Instellingen",icon:"pi pi-sliders-h",roles:["ADMIN"],order:999},h=[...i,...ve.menuItems,r].sort((d,l)=>d.order-l.order),j=_(()=>h.filter(d=>t.hasRole(...d.roles))),m={dashboard:{label:"Dashboard"},clients:{label:"Klanten"},"client-detail":{label:"Klantdetail",parent:{label:"Klanten",to:"/clients"}},projects:{label:"Projecten"},"project-detail":{label:"Projectdetail",parent:{label:"Projecten",to:"/projects"}},tasks:{label:"Taken"},"time-entries":{label:"Urenregistratie"},invoices:{label:"Facturen"},proposals:{label:"Offertes"},expenses:{label:"Uitgaven"},finance:{label:"Financieel overzicht"},settings:{label:"Instellingen"}},b=_(()=>{const d=m[n.name];if(!d)return[{label:"Accuro"}];const l=[];return d.parent&&l.push({label:d.parent.label,to:d.parent.to}),l.push({label:d.label}),l}),le=_(()=>{var l;return(((l=t.user)==null?void 0:l.name)||"").split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2)});function Y(d){return d==="/"?n.path==="/":n.path.startsWith(d)}return(d,l)=>{var q,J;const x=S("router-link"),ce=S("router-view");return a(),u("div",Ot,[s("aside",{class:C(["group flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-out overflow-hidden shrink-0",o.value?"w-56":"w-16"]),onMouseenter:l[1]||(l[1]=f=>o.value=!0),onMouseleave:l[2]||(l[2]=f=>o.value=!1)},[s("div",Mt,[l[3]||(l[3]=s("div",{class:"w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"},[s("span",{class:"text-blue-600 font-bold text-sm"},"A")],-1)),s("span",{class:C(["ml-3 text-sm font-semibold text-gray-900 whitespace-nowrap transition-opacity duration-200",o.value?"opacity-100":"opacity-0"])},"Accuro",2)]),s("nav",Lt,[(a(!0),u(k,null,F(j.value,f=>(a(),p(x,{key:f.to,to:f.to,class:C(["flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group/item relative",Y(f.to)?"bg-blue-50 text-blue-700":"text-gray-500 hover:text-gray-900 hover:bg-gray-100"])},{default:g(()=>[s("i",{class:C([f.icon,"text-[15px] w-5 text-center shrink-0"])},null,2),s("span",{class:C(["whitespace-nowrap transition-opacity duration-200",o.value?"opacity-100":"opacity-0 w-0"])},y(f.label),3),Y(f.to)?(a(),u("div",$t)):P("",!0)]),_:2},1032,["to","class"]))),128))]),s("div",Bt,[s("div",{class:"flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer",onClick:l[0]||(l[0]=f=>A(t).logout())},[s("div",Dt,y(le.value),1),s("div",{class:C(["flex-1 min-w-0 transition-opacity duration-200",o.value?"opacity-100":"opacity-0 w-0"])},[s("p",Rt,y((q=A(t).user)==null?void 0:q.name),1),s("p",_t,y((J=A(t).user)==null?void 0:J.role),1)],2)])])],34),s("main",zt,[s("header",Ft,[s("div",Zt,[w(x,{to:"/",class:"text-gray-400 hover:text-gray-600 transition-colors"},{default:g(()=>[...l[4]||(l[4]=[s("i",{class:"pi pi-home text-xs"},null,-1)])]),_:1}),(a(!0),u(k,null,F(b.value,(f,ue)=>(a(),u(k,{key:ue},[l[5]||(l[5]=s("i",{class:"pi pi-angle-right text-gray-300 text-xs"},null,-1)),f.to?(a(),p(x,{key:0,to:f.to,class:"text-gray-400 hover:text-gray-600 transition-colors"},{default:g(()=>[ke(y(f.label),1)]),_:2},1032,["to"])):(a(),u("span",Ut,y(f.label),1))],64))),128))]),l[6]||(l[6]=s("div",{class:"flex items-center gap-2"},[s("span",{class:"text-[10px] font-mono text-gray-400"},"v1.0")],-1))]),s("div",Nt,[s("div",Ht,[w(ce)])])]),w(A(ae),{position:"bottom-right"}),w(A(ie))])}}});export{Xt as default};
