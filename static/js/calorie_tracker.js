
$(document).ready(function() {

    function updateSelectedDate(selectedDate) {
        $('.selected-date').text(selectedDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }));
    }

    var today = new Date();
    updateSelectedDate(today);
    fetch_api(today,today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2));
    fetch_week_data();

    
    
      $('#drawer-toggle').click(function() {
        $('.drawer').toggleClass('open');
        disableBodyScrolling();
        $("#loader-icons").css("display", "block");
        $.ajax({
        type: 'POST',
        url: '/api/fetch-suggestions/',
        data: { 'input-text': 'suggest' },
        success: function (data) {
        console.log(data);
        $("#loader-icons").css("display", "none");
        var htmldata = "";
        for (var key in data) {
            htmldata+=`<p class = mb-1 mt-1" style="font-size: medium; color:#5c5c5c; padding-left: 10px;"><b>`+key+`</b></p>`
                    htmldata += fetch_item_rec_html(data[key][0]['item'], data[key][0]['calories'], data[key][0]['protein'], data[key][0]['carbs'], data[key][0]['fats']);
                    htmldata += fetch_item_rec_html(data[key][1]['item'], data[key][1]['calories'], data[key][1]['protein'], data[key][1]['carbs'], data[key][1]['fats']);
        }
        $("#rec-display").hide().html(htmldata).slideDown()
        $(".rec-calories").css('height', 'auto');
        },
        error: function (xhr, status, error) {
        console.error(error);
        }
        });

    });

    
        // Prevent scrolling of the main page when the drawer is open
        function disableBodyScrolling() {
            $('body').addClass('no-scroll');
          }
        
          // Function to enable body scrolling
          function enableBodyScrolling() {
            $('body').removeClass('no-scroll');
          }

      $('#close-drawer-btn').click(function() {
        $('.drawer').removeClass('open');
        enableBodyScrolling();
        $("#loader-icons").css("display", "none");
        $("#rec-display").html("");
      });
    
    var date_input = flatpickr($('.date-input'),{
        dateFormat: 'd/m/Y',
        altInput: true,
        altFormat: 'F j, Y',
        maxDate: 'today',
        allowInput: true,
        defaultDate: new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }),
        onChange: function (selectedDates, dateStr, instance) {
            updateSelectedDate(selectedDates[0]);
            fetch_api(selectedDates[0]. selectedDates[0].getFullYear() + '-' + ('0' + (selectedDates[0].getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDates[0].getDate()).slice(-2));
        }
    });

    $('.input-group').click(function() {
        date_input.open();
    });
// next day and prev day buttons should change date-input and selected-date
    
    $('#prev-day').click(function () {
        var selectedDateStr = $('.date-input').val();
        var dateParts = selectedDateStr.split("/");
        var selectedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        
        selectedDate.setDate(selectedDate.getDate() - 1);
        fetch_api(selectedDate, selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2));
        date_input.setDate(selectedDate);
        updateSelectedDate(selectedDate);
        
    });


    $('#next-day').click(function () {
        var selectedDateStr = $('.date-input').val();
        var dateParts = selectedDateStr.split("/");
        var selectedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        
        if (selectedDate.getDate() === new Date().getDate()) {
            selectedDate.setDate(selectedDate.getDate());
        }
        else {
            selectedDate.setDate(selectedDate.getDate() + 1);
            fetch_api(selectedDate, selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2));
        }

        
        date_input.setDate(selectedDate);
        updateSelectedDate(selectedDate);
    });

    $('.toggle-switch input').change(function() {
        if ($(this).is(':checked')) {
          console.log('Switch is on');
          $(".toggle-label").css('color','#1E90FF');
        } else {
            $(".toggle-label").css('color','rgb(117, 117, 117)');
        }
      });

      
     
      
      function changePlannedText() {
        const $text = $('.planned-indication');
        const screenWidth = $(window).width();

        if (screenWidth < 768) {
            $text.css('display','none')
        } else {
            $text.css('display','block')
        }
    }
     if ($(window).width() < 768) {
        changePlannedText();
     }

     $(window).on('resize', changePlannedText);
    function fetch_api(input_date, input_date_string, inputText = null) {
        $('#fetch-calories').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        if (input_date.getDate() === new Date().getDate()) {
            $("#plan-mode-div").css('display','flex');
        } else {
            $("#plan-mode-div").css('display','none');
        }
        var isChecked = $("#plan-mode").is(':checked');
        var mode = 'completed';
        if(isChecked){
            mode = 'plan';
        }
        console.log(mode);
        $.ajax({
            type: 'POST',
            url: '/api/fetch-calories/',
            data: { 'input-text': inputText, 'input-date': input_date_string, 'mode': mode},
            success: function (data) {
                console.log(data);
                $('#result-food-items').html("");
                if ('message' in data) {
                    $('#input-text').val('');
                    $('#result-aggregate').css('display', 'none');
                    $('#fetch-calories').text("Get Calorie details");
                    $('#p_title').text("Add food items:");
                    $('#delete-button').css('display', 'none');
                    fetch_week_data();
                }
                else {
                    $('#input-text').val('');
                    displayDataTable(data);
                    displayAggregateData(data);
                    fetch_week_data();

                    updateAddDeleteIndividualListeners();
                

                    $('#title-top').text(input_date.toLocaleDateString('en-GB', { weekday: 'long' })+"'s Calorie Counter");
                    $('#result-aggregate').css('display', 'block');
                    $('#fetch-calories').text("Update Calorie details");
                    $('#p_title').text("Add more food items:");
                    $('#delete-button').css('display', 'block');
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    };

    function updateAddDeleteIndividualListeners() {
        $('.delete-individual-btn').click(function (event) {
            var id = $(this).attr('data-id');
            $('#wrapper-'+id).slideUp('fast', function() {
                $('#wrapper-'+id).remove();
            })
            $.ajax({
                type: 'POST',
                url: '/api/delete-individual/',
                data: { id: id },
                success: function (data) {
                if ('message' in data & data['message'] == 'Deleted') {
                        var selectedDateStr = $('.date-input').val();
                        var dateParts = selectedDateStr.split("/");
                        var selectedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                        fetch_api(selectedDate, selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2));
                    } 
            },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
            
            

        });

        $('.add-planned-btn').click(function (event) {
            var id = $(this).attr('data-id');
            var selectedDateStr = $('.date-input').val();
            var dateParts = selectedDateStr.split("/");
            var selectedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
            var input_date_string = selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2);
            $.ajax({
                type: 'POST',
                url: '/api/add-planned/',
                data: { id: id },
                success: function (data) {
                if ('message' in data & data['message'] == 'Added') {
                        
                        fetch_api(selectedDate, selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2));
                    } 
            },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
            
            

        });
    };
    $('#fetch-calories').click(function(event) {

        var selectedDateStr = $('.date-input').val();
        var dateParts = selectedDateStr.split("/");
        var input_date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        var input_date_string = input_date.getFullYear() + '-' + ('0' + (input_date.getMonth() + 1)).slice(-2) + '-' + ('0' + input_date.getDate()).slice(-2);
        var inputText = $('#input-text').val();
        fetch_api(input_date, input_date_string, inputText);
    });

    

    $('#delete-button').click(function(event) {
        var selectedDateStr = $('.date-input').val();
        var dateParts = selectedDateStr.split("/");
        var input_date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        var input_date_string = input_date.getFullYear() + '-' + ('0' + (input_date.getMonth() + 1)).slice(-2) + '-' + ('0' + input_date.getDate()).slice(-2);
        $.ajax({
            type: 'POST',
            url: '/api/delete-calories/',
            data: { 'input-date': input_date_string },
            success: function (data) {
                $('#result-food-items').html("");
                if ('message' in data & data['message'] == 'Deleted') {
                    $('#input-text').val('');
                    $('#result-aggregate').css('display', 'none');
                    $('#fetch-calories').text("Get Calorie details");
                    $('#p_title').text("Add food items:");
                    $('#delete-button').css('display', 'none');
                    fetch_week_data();
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    });
        function displayDataTable(data) {
            var tableHtml= "";
            for (var i = 0; i < data['table_data'].length; i++) {
            tableHtml += fetch_table_item_html(data['table_data'][i]['Item'],data['table_data'][i]['Quantity'],data['table_data'][i]['Serving Size'],data['table_data'][i]['Calories'],data['table_data'][i]['Date'], data['table_data'][i]['id'], data['table_data'][i]['status'])
            }
            $('#result-food-items').html(tableHtml);
            changePlannedText();
        }

        function displayAggregateData(data) {
            $('#total_field').html(data['total_calories']+' <span style = "padding: 0; margin:0; font-size: small;">KCal</span>');
            $('#protein_field').text(data['total_pr']+'g');
            $('#carbs_field').text(data['total_cb']+'g');
            $('#fats_field').text(data['total_fa']+'g');
        }

        // CHART --------------------------------------------------------------------------------------

        function fetch_week_data() {
            $.ajax({
                type: 'POST',
                url: '/api/fetch-week-data/',
                data: { 'request': 'week-data' },
                success: function (data) {
                    updateChart(data[0])
                    },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        }
        
        
    function updateChart(weekly_dict) {
        if  (weekly_dict != undefined) {
            $("#no_data").css('display', 'none');
            $("#last_week_cals").text(weekly_dict['avg_weekly_calories_prev']+' KCal');
            $("#this_week_cals").text(weekly_dict['avg_weekly_calories_current']+' KCal');
            $("#weekly_avg_field").text(weekly_dict['avg_weekly_calories_current']);
            var growth_var = weekly_dict['avg_weekly_calories_current']-weekly_dict['avg_weekly_calories_prev'];
            if(growth_var>0){
                $("#r1wk_growth_field").text('+'+growth_var+' KCal');
            }
            else {
                $("#r1wk_growth_field").text(growth_var+' KCal');
            }
            if(weekly_dict['avg_weekly_calories_prev']!=0 & weekly_dict['avg_weekly_calories_prev']!=0) {
                var growth_pct = growth_var / weekly_dict['avg_weekly_calories_prev'] * 100;
                growth_pct = Math.round(growth_pct * 10) / 10;
                if(growth_pct > 0){
                    $("#r1wk_growth_pct_field").css('color', '#32CD32');
                    $("#r1wk_growth_pct_field").html('+'+growth_pct+'<h5 style = "font-size: large; display:inline;">%</h5>');
                    
                }
                else {
                    $("#r1wk_growth_pct_field").css('color', 'rgb(223, 71, 89)');
                    $("#r1wk_growth_pct_field").html(growth_pct+'<h5 style = "font-size: large; display:inline;">%</h5>');
                    
                }
            }
            else {
                $("#r1wk_growth_pct_field").html('-');
            }
            
            
            
            var chart = Chart.getChart('daily_tracker');
        if (chart) {
            chart.destroy();
        }

        var last_seven_days = weekly_dict['last_seven_days'];
        var protein_week_values = weekly_dict['protein'];
        var carbs_week_values = weekly_dict['carbs'];
        var fats_week_values = weekly_dict['fat'];
        var total_week_calories = weekly_dict['calories'];



        // Create the chart
        var ctx = document.getElementById('daily_tracker').getContext('2d');
        var dailyTracker = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last_seven_days,
                datasets: [
                    {
                        label: 'Daily Calorie Intake (KCal)',
                        data: total_week_calories,
                        type: 'line',
                        borderColor: '#ffcf1f',
                        backgroundColor: '#ffcf1f',
                        borderWidth: 2,
                        yAxisID: 'line-axis'
                    },
                    {
                        label: 'Protein (g)',
                        data: protein_week_values,
                        backgroundColor: 'rgb(118, 183, 249)',
                        borderColor: 'rgb(118, 183, 249)',
                        borderWidth: 0.3
                    },
                    {
                        label: 'Carbs (g)',
                        data: carbs_week_values,
                        backgroundColor: 'rgb(45, 174, 16, 1)',
                        borderColor: 'rgb(45, 174, 16, 1)',
                        borderWidth: 0.3
                    },
                    {
                        label: 'Fats (g)',
                        data: fats_week_values,
                        backgroundColor: 'rgb(223, 71, 89, 1)',
                        borderColor: 'rgb(223, 71, 89, 1)',
                        borderWidth: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                height: 400,
                width: 600,
                scales: {
                    y: {
                        stacked:true,
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Macros (g)',
                            color: 'black',
                            font: {
                              family: 'sans-serif',
                              size: 12,
                              lineHeight: 1.2,
                            }
                        },
                        id: 'stacked-axis',
                        ticks: {
                            beginAtZero: true,
                            fontFamily: 'sans-serif',
                            fontStyle: 'bold',
                            color: 'gray'
                        },
                        grid: {
                            drawOnChartArea: false
                          }
                    },
                    x: {
                        stacked: true,
                        ticks: {
                            fontFamily: 'sans-serif',
                            fontStyle: 'bold',
                            color: 'gray',
                            maxRotation: 0,
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 20,
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
        }
        else {
            var chart = Chart.getChart('daily_tracker');
            if (chart) {
                chart.destroy();
            }
            
            $("#no_data").text('Not enough data for weekly analysis. Please track your calories for at least 7 days.');
            $("#no_data").css('display', 'block');
        }
        

        




        }
        
});