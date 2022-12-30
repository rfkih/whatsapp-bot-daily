var bfCount = `select count(1) as count from aact_trx_actlog_bf where trx_il = trunc(sysdate)`;

var checkCloseBranch = `select b.enm, a.br_no, to_char(a.open_il, 'YYYY/MM/DD') as open_il , a.bon_clsgb, a.CLS_BIT
                        from aact_acc_clsbr a, acom_bix_base b
                        where a.br_no = b.br_no
                        and tr_il = trunc(sysdate)
                        order by a.cls_bit desc`;

var closeAccountHavebalance = {
  name: "CLOSE ACCOUNT HAVE BALANCE IN TRX_BAL",
  query: `SELECT A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM, SUM(B.BAL_AMT)
FROM ACOM_CONT_BASE A, AACT_TRX_BAL B, ACOM_COM_ACTCD C
WHERE A.REF_NO = B.REF_NO
 AND A.STS = '9'
 AND C.BR_NO = '0000'
 AND C.BSPL_GB = 'B'
 AND B.ATIT_CD = C.AC_CD
 AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT
 AND B.BAL_AMT <> 0
 AND (ATIT_CD NOT LIKE '815%' AND ATIT_CD NOT LIKE '915%') -- COA WO
--AND B.ATIT_CD IN ('15422014', '15421014') COA AMORT RESTRU
GROUP BY A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM
ORDER BY REF_NO`,
};

var giroPrkCancelCheck = {
    name : "Giro PRK Cancel Check",
    query : `      SELECT A.*                                                                                                      
    , CASE WHEN A.L_BAL_AMT > 0 THEN 'C'                                                                    
           ELSE 'D'                                                                                         
            END ADJ_L_DRCR                                                                                  
    , CASE WHEN A.L_BAL_AMT > 0 THEN 'D'                                                                    
           ELSE 'C'                                                                                         
            END ADJ_D_DRCR                                                                                  
    , CASE WHEN A.L_BAL_AMT > D_BAL_AMT THEN D_BAL_AMT                                                      
           ELSE L_BAL_AMT                                                                                   
            END ADJUST_AMT                                                                                  
    , '0' AS IBF_GB                                                                                         
 FROM (SELECT REF_NO                                                                                        
            ,CCY                                                                                            
            ,BR_NO                                                                                          
            ,MAX(L_DTLS_BAL_DV_CD) L_DTLS_BAL_DV_CD                                                         
            ,MAX(D_DTLS_BAL_DV_CD) D_DTLS_BAL_DV_CD                                                         
            ,MAX(L_ATIT_CD) L_ATIT_CD                                                                       
            ,MAX(D_ATIT_CD) D_ATIT_CD                                                                       
            ,SUM(L_BAL_AMT) L_BAL_AMT                                                                       
            ,SUM(D_BAL_AMT) D_BAL_AMT                                                                       
         FROM (SELECT REF_NO                                                                                
                    , CCY                                                                                   
                    , BR_NO                                                                                 
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN DTLS_BAL_DV_CD                        
                           ELSE ''                                                                          
                            END L_DTLS_BAL_DV_CD                                                            
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN DTLS_BAL_DV_CD                        
                           ELSE ''                                                                          
                            END D_DTLS_BAL_DV_CD                                                            
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN ATIT_CD                               
                           ELSE ''                                                                          
                            END L_ATIT_CD                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN ATIT_CD                               
                           ELSE ''                                                                          
                            END D_ATIT_CD                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN BAL_AMT                               
                           ELSE 0                                                                           
                            END L_BAL_AMT                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN BAL_AMT                               
                            ELSE 0                                                                          
                             END D_BAL_AMT                                                                  
                 FROM AACT_TRX_BAL                                                                          
                WHERE REF_NO IN (SELECT REF_NO                                                              
                                   FROM AACT_TRX_BAL                                                        
                                  WHERE REF_NO IN (SELECT REF_NO                                            
                                                     FROM AACT_TRX_BAL                                      
                                                    WHERE TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT       
                                                      AND ATIT_CD = '21831001'                                 
                                                      AND BAL_AMT > 0                                          
                                                  )                                                            
                                    AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT         
                                    AND ATIT_CD = '15422011'                                                   
                                    AND (BAL_AMT > 0 OR BAL_AMT < 0)                                           
                                )                                                                              
                  AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT                           
                  AND ATIT_CD IN ('15422011', '21831001')                                                      
             )                                                                                                 
        GROUP BY REF_NO,CCY,BR_NO                                                                              
    ) A                                                                                                        
ORDER BY REF_NO`,
}

var GlBalanceCheck = {
    name : 'GL Balance Check',
    query : `SELECT *
    FROM (SELECT 'BS' AS GBBBBBBBBBB,
                    TR_IL,
                 --TO_CHAR(TR_IL, 'YYYY/MM/DD'),
                 BR_NO,
                 SUM(DR) AS DR,
                 SUM(CR) AS CR,
                 SUM(DR) - SUM(CR) AS DIFFFFFFFFFF
            FROM (SELECT TR_IL ,
                         BR_NO,
                         CASE
                           WHEN SUBSTR(AC_CD, 1, 1) = '1' THEN
                            AF_FJAN
                           ELSE
                            0
                         END AS DR,
                         CASE
                           WHEN SUBSTR(AC_CD, 1, 1) IN ('2', '3') THEN
                            AF_FJAN
                           ELSE
                            0
                         END AS CR
                    FROM AACT_ACT_DATE
                   WHERE TR_IL = trunc(sysdate)
                     AND SUBSTR(AC_CD, 1, 1) IN ('1', '2', '3'))
           GROUP BY TR_IL, BR_NO
          UNION ALL
          SELECT 'PL' AS GB,
                 TR_IL,
                 BR_NO,
                 SUM(DR),
                 SUM(CR),
                 (SUM(DR) - SUM(CR)) + SUM(DIFF)
            FROM (SELECT TR_IL,
                         BR_NO,
                         CASE
                           WHEN SUBSTR(AC_CD, 1, 1) IN ('5') THEN
                            AF_FJAN --?? / DR
                           ELSE
                            0
                         END AS DR,
                         CASE
                           WHEN SUBSTR(AC_CD, 1, 1) IN ('4') THEN
                            AF_FJAN --?? / ?? / CR
                           ELSE
                            0
                         END AS CR,
                         CASE
                           WHEN AC_CD = '33101001' THEN
                            AF_FJAN
                           ELSE
                            0
                         END AS DIFF
                    FROM AACT_ACT_DATE
                   WHERE TR_IL = trunc(sysdate))
           GROUP BY TR_IL, BR_NO
          UNION ALL
          SELECT 'BS/PL' AS GB,
                 TR_IL,
                 BR_NO,
                 SUM(DR),
                 SUM(CR),
                 SUM(DR) - SUM(CR)
            FROM (SELECT TR_IL,
                         BR_NO,
                         CASE
                           WHEN SUBSTR(AC_CD, 1, 1) IN ('1', '5') THEN
                            AF_FJAN --?? / DR
                           ELSE
                            0
                         END AS DR,
                         CASE
                           WHEN SUBSTR(AC_CD, 1, 1) IN ('2', '3', '4') THEN
                            AF_FJAN --?? / ?? / CR
                           ELSE
                            0
                         END AS CR
                    FROM AACT_ACT_DATE
                   WHERE TR_IL = trunc(sysdate)
                     AND AC_CD != '33101001')
           GROUP BY TR_IL, BR_NO)
  --ORDER BY GB, TR_IL, BR_NO 
  UNION ALL
  --RCH_BAL 
  SELECT 'AFEX_RCH_BAL',
         T1.TR_IL,
         T1.CD,
         T1.SHW_OPBS - NVL(T2.AMT, 0),
         T1.SHW_CLBS,
         (T1.SHW_OPBS - NVL(T2.AMT, 0)) - T1.SHW_CLBS AS DIFF
    FROM AFEX_RCH_BAL T1
    LEFT OUTER JOIN (SELECT CD,
                            SUM(CASE
                                  WHEN DRCR_GB = 'D' THEN
                                   DRCR_AMT * -1
                                  WHEN DRCR_GB = 'C' THEN
                                   DRCR_AMT
                                END) AS AMT
                       FROM AFEX_RCH_PEND
                      WHERE TR_IL = trunc(sysdate)
                        AND SA_GB = 'S'
                      GROUP BY CD) T2
      ON T1.CD = T2.CD
   WHERE T1.TR_IL = trunc(sysdate)
  --   AND T1.CD < 2011
  UNION ALL
  --28911001
  --WASH
  SELECT 'WASH',
         A.TR_IL,
         A.BR_NO,
         NVL(SUM(DECODE(B.BLDRCR_GB, 'D', A.AF_FJAN, 0)), 0) AS drFamt,
         NVL(SUM(DECODE(B.BLDRCR_GB, 'C', A.AF_FJAN, 0)), 0) AS crFamt,
         NVL(SUM(DECODE(B.BLDRCR_GB, 'D', A.AF_FJAN, -A.AF_FJAN)), 0) AS fdiff
    FROM AACT_ACT_DATE A, ACOM_COM_ACTCD B
   WHERE A.BSPL_GB = 'B'
     AND A.TR_IL = trunc(sysdate)
     AND A.BSPL_GB = B.BSPL_GB
     AND A.AC_CD = B.AC_CD
     AND A.AC_CD = '28911001'
     AND B.BR_NO = '0000'
     AND B.AC_KD NOT IN ('6', '7', '8', '9')
   GROUP BY A.BR_NO, A.TR_IL
  UNION ALL
  --ATMCASH
  SELECT 'ATMCASH', A.*, A.ATM_DT_BAL - A.ACT_DT_BAL AS DIFF
    FROM (SELECT A.TR_DT,
                 A.BR_NO,
                 SUM(A.AF_BAL) AS ATM_DT_BAL,
                 B.AF_FJAN AS ACT_DT_BAL
            FROM AACT_ATM_DATE A
           INNER JOIN AACT_ACT_DATE B
              ON A.AC_CD = B.AC_CD
             AND A.BR_NO = B.BR_NO
             AND A.TR_DT = B.TR_IL
           WHERE 1 = 1
           GROUP BY A.TR_DT, A.BR_NO, B.AF_FJAN) A
   WHERE A.TR_DT = trunc(sysdate)
   `,
}

var GlBalanceVsTrxBal = {
    name : "GL Balance VS TRX Bal",
    query : `SELECT B.*, A.*
    FROM ACOM_COM_ACTCD A, --TABEL COA
         (SELECT BR_NO,
                 COA_CD,
                 CCY,
                 SUM(TRX_AMT) AS TRX_AMT,
                 SUM(ACT_AMT) AS ACT_AMT,
                 SUM(TRX_AMT) - SUM(ACT_AMT) AS DIFF_AMT
            FROM (SELECT BR_NO,
                         ATIT_CD AS COA_CD,
                         CCY,
                         SUM(BAL_AMT) AS TRX_AMT,
                         0 AS ACT_AMT
                    FROM AACT_TRX_BAL --TABEL TRANSAKSI BALANCE
                   WHERE BAL_AMT != 0
                        --AND     ATIT_CD   = '18304101'
                        --AND     BR_NO     = '1201'
                     AND trunc(sysdate) BETWEEN APCL_STR_DT AND APCL_END_DT
                   GROUP BY BR_NO, ATIT_CD, CCY
                  UNION ALL
                  SELECT BR_NO, AC_CD, CCY, 0, SUM(AF_FJAN) AS ACT_AMT
                    FROM AACT_ACT_DATE --TABEL GENERAL LEDGER
                   WHERE TR_IL = trunc(sysdate)
                        --AND     AC_CD = '18304101'
                     AND AF_BJAN != 0
                   GROUP BY BR_NO, AC_CD, CCY)
           GROUP BY BR_NO, COA_CD, CCY
          HAVING SUM(TRX_AMT) - SUM(ACT_AMT) != 0) B
   WHERE A.BR_NO = '0000'
     AND A.AC_CD = B.COA_CD
     AND A.AC_KD IN ('1', '2', '3', '6', '7', '8', '9')
     AND A.AC_CD NOT IN ('10101001' -- Cash in Vault
                        ,'10102001' -- Petty Cash
                        ,'10104001' -- ATM Cash
                        ,'10401001' -- Demand Deposit at Bank Indonesia
                        ,'10421001' -- Demand Deposit at Domestic Banks
                        ,'18302101' -- Suspence Receivable ATM
                        ,'18809001' -- Inter Office Account
                        ,'28809001' -- Inter Office A/C (Settlement)
                        ,'19959002' -- ARTAJASA Receivable
                        ,'19959003' -- ALTO Receivable
                        ,'28936001' -- Liability to Indosat Due to Overbooking Transaction
                        ,'28937001' -- Liability to XL Due to Overbooking Transaction
                        ,'28938001' -- Liability to Smartfen Due to Overbooking Transaction
                        ,'28941001' -- Liability to ARTAJASA 
                        ,'28942001' -- Liability to ATM Fee
                        ,'28943001' -- Liability to  Join Debit Due to Overbooking Transaction
                        ,'33001001' -- Previous Years Accumulated Profit/Loss
                        ,'33101001' -- Current Year Profit/Loss
                        ,'28090001'
                                              ,'28911001'
                                              ,'80000002'
                                              ,'90000002'
                                              ,'28944001'
                                              ,'28940001'
                                              ,'20040002')
   ORDER BY B.COA_CD, B.BR_NO, B.CCY`
}

var liabiltyMinusCheck = {
    name : "Liability Minus Check",
    query : `SELECT A.TR_IL, A.BR_NO, B.ENM AS COA_NM, A.AC_CD AS COA, A.AF_FJAN, A.CCY, '' AS REF_NO
    FROM AACT_ACT_DATE A, ACOM_COM_ACTCD B --TABEL GL DAN COA 
   WHERE A.AC_CD = B.AC_CD
     AND A.TR_IL = TRUNC(SYSDATE)
     AND A.AC_CD LIKE '2%' --COA LIAB
     AND A.AC_CD <> '28991501' --COA CKPN NOT INCLUDE
     AND A.AF_FJAN < 0
  UNION ALL
  SELECT C.APCL_STR_DT, C.BR_NO, D.ENM AS COA_NM, C.ATIT_CD AS COA, C.BAL_AMT, C.CCY, C.REF_NO
    FROM AACT_TRX_BAL C, ACOM_COM_ACTCD D --TABEL TRANSAKSI BALANCE DAN COA 
   WHERE C.ATIT_CD = D.AC_CD
     AND C.ATIT_CD LIKE '2%'
     AND C.ATIT_CD <> '28991501' --COA CKPN NOT INCLUDE
     AND TRUNC(SYSDATE)-1 BETWEEN APCL_STR_DT AND APCL_END_DT
     AND C.BAL_AMT < 0
     AND C.REF_NO NOT LIKE 'DJN%'
     --and C.APCL_STR_DT > TO_DATE('18072019', 'DDMMYYYY')`
}


var allocationCollateral = {
  name: "Allocation Collateral",
  query: `
SELECT  *
FROM    ACOM_BAT_PROCLST
WHERE   PROC_BRNO = '0888'
AND     PROC_DT   = TRUNC(SYSDATE)-1
AND     JOB_ID    LIKE 'dmb%'
AND     SEQ_NO    = 0
AND     PROC_STS  <> 2
`,
};

var checkBatchJob = {
  name: "Check Batch Job",
  query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
CASE 
WHEN PROC_STS = '1' THEN 'ON PROCESSING' 
WHEN PROC_STS = '2' THEN 'SUCCESS' ELSE 'FAILED' END AS STATUS, 
CASE 
WHEN RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%' THEN 'RUNNING ON EOM' ELSE RTN_MSG END AS RTN_MSG FROM 
(
SELECT * FROM ACOM_BAT_PROCLST A WHERE A.PROC_DT >= TRUNC(SYSDATE) AND A.STR_TM > '07:00:00' AND BAT_PGM_ID <> 'RTGS_ACTUAL_REGIST' --TABEL AUTO BATCH
) C
WHERE PROC_STS = '9' --STATUS ERROR
AND NOT 
(RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%'  -- RUNNING ON EOM
OR RTN_MSG LIKE '(CMB_INIT_PASS)%'                           -- WRONG PASS
OR RTN_MSG LIKE '(2010:0)%'                                  -- TODAY IS HOLIDAY
OR RTN_MSG LIKE '(cmb_dt_reconcile:%')                       -- PRINTER IS NOT OPEN
ORDER BY C.PROC_DT, C.STR_TM`,
};

module.exports = {
  bfCount,
  checkCloseBranch,
  allocationCollateral,
  checkBatchJob,
  closeAccountHavebalance,
  giroPrkCancelCheck,
  GlBalanceCheck,
  GlBalanceVsTrxBal,
  liabiltyMinusCheck
};
