import moment from "moment";

function findSamePlateUpward(list1, list2, startIndex, timePeriodSeconds){
    list2
      .slice(0, startIndex)
      .reverse()
      .some((event, j)=>{
        // stop if time difference too great or already verified
        if( moment(list1[startIndex]?.captureISODate).diff(moment(event.captureISODate), 'seconds') > timePeriodSeconds 
            || (event.status && event.status !== 'unknown') ) return true
        // if same plate found, align the two plates by filling the gap between them
        if(list1[startIndex].plate === event.plate){
          list1[startIndex].status = list1[startIndex].status || 'maybe';
          event.status = event.status || 'maybe';
          list2.splice(startIndex-j-1, 0, ...( new Array(j+1).fill({status: 'unknown'}) ));
          return true
        }
        return false;
      });
  }
  
  function findSamePlateDownward(list1, list2, startIndex, timePeriodSeconds){
    list2
      .slice(startIndex+1)
      .some((event, j)=>{
        // stop if time difference too great or already verified
        if( moment(event.captureISODate).diff(moment(list1[startIndex]?.captureISODate), 'seconds') > timePeriodSeconds 
            || (event.status && event.status !== 'unknown') ) return true
        // if same plate found, align the two plates by filling the gap between them
        if(list1[startIndex].plate === event.plate){
          list1[startIndex].status = list1[startIndex].status || 'maybe';
          event.status = event.status || 'maybe';
          list1.splice(startIndex, 0, ...( new Array(j+1).fill({status: 'unknown'}) ));
          return true
        }
        return false;
      });
  }
  
  function compareLists(list1, list2){
    // sort both lists by timestamp
    const sortedList1 = list1.sort((a, b) => a.timestamp - b.timestamp);
    const sortedList2 = list2.sort((a, b) => a.timestamp - b.timestamp);
    const timePeriodSeconds = 120;
    // ======================
    // browse the two lists sequentially and check plates correspondance within time period
    for (let i = 0; i < sortedList1.length && i < sortedList2.length; i++) {
      if ( sortedList1[i].plate === sortedList2[i].plate ){
        sortedList1[i].status = sortedList1[i].status || 'maybe';
        sortedList2[i].status = sortedList2[i].status || 'maybe';
        continue;
      }
      findSamePlateUpward(sortedList1, sortedList2, i, timePeriodSeconds);
      
      findSamePlateDownward(sortedList1, sortedList2, i, timePeriodSeconds)
    }
    return [sortedList1, sortedList2];
  }

  export default compareLists;