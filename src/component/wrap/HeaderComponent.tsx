import { useEffect, useState, useRef } from 'react';
import './scss/HeaderComponent.scss';
import useCustomHook from '../custom/useCustom';

export default function HeaderComponent(){

    const {onClickALink} = useCustomHook();

    type 슬라이드Type = {
        코드번호: string;
        클래스: string;
        이미지: string;
        코멘트: string;
    }
    type 바로가기Type = {
        코드번호: string;
        타이틀: string;
        이미지: string;
    }

    type 패치데이터Type = {
        메인슬라이드: 슬라이드Type[],
        바로가기: 바로가기Type[]
    };

    type 스테이트Type = {
        슬라이드: 슬라이드Type[],
        바로가기: 바로가기Type[],
    }

    const [state, setState] = useState<스테이트Type>({
        슬라이드: [],
        바로가기: []
    });

    // 자바스크립트 에서 지원되는 API
    // API => fetch() => JSON
    // 프로미스 비동기 방식
    useEffect(()=>{
        fetch('./data/header.json', {method: 'GET'})
        .then((res)=>res.json())  // JSON 형식 변환
        .then((data: 패치데이터Type)=>{
            setState({
                ...state,
                슬라이드: data.메인슬라이드
            })

        })  // 결과 가져오기 상태변수에 저장한기
        .catch((err)=>{
            console.log('fetch 오류!')
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])


    
    // 1. 상태변수
    const [cnt, setCnt] = useState(0);
    
    // 4. 선택자
    const slideWrap = useRef<HTMLUListElement | null>(null);


    // 2. 타이머
    useEffect(()=>{
        const id = setInterval(()=>{
            setCnt(cnt=>cnt+1);
        }, 6000);
        return ()=> clearInterval(id);
    }, []);

    // 3. cnt 변화 감지
    useEffect(()=>{

        if(slideWrap.current===null) return;

        if(cnt>3){
            slideWrap.current.style.transition = `none`;
            slideWrap.current.style.left = `${-100*0}%`;
            setTimeout(()=>{
                setCnt(1);
            },100);
        }
        else {
            slideWrap.current.style.transition = `left 0.6s`;
            slideWrap.current.style.left = `${-100*cnt}%`;
        }

       
    }, [cnt]);


    return(
        <header id="header">
            <div className="slide-container">
                <div className="slide-view">
                    <ul ref={slideWrap} className="slide-wrap">
                    {
                        state.슬라이드.map((item)=> 
                            <li key={item.코드번호} data-key={item.코드번호}  className={`slide ${item.클래스} last`}>
                                <a onClick={(e)=>onClickALink(e, 'https://naver.com')} href='!#' title={item.코멘트}>
                                    <img src={`./images/${item.이미지}`} alt={item.코멘트}/>
                                    <h2>To Do List</h2>
                                </a>
                            </li>
                        )
                    }
                    </ul>
                </div>
            </div>
        </header>
    )
}