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

    $('#title-top').text(today.toLocaleDateString('en-GB', { weekday: 'long' })+"'s Calorie Counter");
    $('.collapsible-header').click(function() {
        $(this).closest('.collapsible-div').toggleClass('active');
        $(this).next('.collapsible-body').slideToggle(200);
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

    function fetch_api(input_date, input_date_string, inputText = null) {
        $('#fetch-calories').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        $.ajax({
            type: 'POST',
            url: '/api/fetch-calories/',
            data: { 'input-text': inputText, 'input-date': input_date_string},
            success: function (data) {
                $('#result-table').html("");
                if ('message' in data) {
                    $('#input-text').val('');
                    $('#result-aggregate').css('display', 'none');
                    $('#fetch-calories').text("Get Calorie details");
                    $('#p_title').text("Add food items:");
                    $('#delete-button').css('display', 'none');
                }
                else {
                    $('#input-text').val('');
                    displayDataTable(data);
                    displayAggregateData(data);
                    if (inputText != null) {
                        fetch_week_data();
                    }
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
                $('#result-table').html("");
                if ('message' in data & data['message'] == 'Deleted') {
                    $('#input-text').val('');
                    $('#result-aggregate').css('display', 'none');
                    $('#fetch-calories').text("Get Calorie details");
                    $('#p_title').text("Add food items:");
                    $('#delete-button').css('display', 'none');
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    });

        // function displayDataTable(data) {
        //     var tableHtml = '<table class="table table-bordered table-striped text-center" style = "margin-bottom: 35px;">';
        //     tableHtml += '<tbody><tr>';
        //     for (var key in data['table_data'][0]) {
        //         tableHtml += '<td><b>' + key + '</b></td>';
        //     }
        //     tableHtml += '</tr>';
        //     tableHtml += '';
        //     for (var i = 0; i < data['table_data'].length; i++) {
        //         tableHtml += '<tr>';
        //         for (var key in data['table_data'][i]) {
        //             tableHtml += '<td>' + data['table_data'][i][key] + '</td>';
        //         }
        //         tableHtml += '</tr>';
        //     }
        //     tableHtml += '<tr><td colspan="3"><b>Total Calories</b></td><td><b>'+data['total_calories']+'</b></td></tr>';

        //     tableHtml += '</tbody></table>';
        //     $('#result-table').html(tableHtml);
        // }

        function displayDataTable(data) {
            var tableHtml = '<table class="table table-bordered table-striped text-center" style="margin-bottom: 35px;">';
            tableHtml += '<tbody><tr>';
            for (var key in data['table_data'][0]) {
                tableHtml += '<td><b>' + key + '</b></td>';
            }
            tableHtml += '</tr>';
            tableHtml += '';
            for (var i = 0; i < data['table_data'].length; i++) {
                tableHtml += '<tr>';
                for (var key in data['table_data'][i]) {
                    tableHtml += '<td class="column-' + key.replace(/\s+/g, '-').toLowerCase() + '">' + data['table_data'][i][key] + '</td>';
                }
                tableHtml += '</tr>';
            }
            tableHtml += '<tr><td colspan="3"><b>Total Calories</b></td><td><b>'+data['total_calories']+'</b></td></tr>';
            tableHtml += '</tbody></table>';
            $('#result-table').html(tableHtml);
        }

        function displayAggregateData(data) {
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
        $("#last_week_cals").text(weekly_dict['avg_weekly_calories_prev']+' KCal');
        $("#this_week_cals").text(weekly_dict['avg_weekly_calories_current']+' KCal');
        $("#weekly_avg_field").text(weekly_dict['avg_weekly_calories_current']);
        var growth_var = weekly_dict['avg_weekly_calories_current']-weekly_dict['avg_weekly_calories_prev']
        var growth_pct = growth_var / weekly_dict['avg_weekly_calories_prev'] * 100
        growth_pct = Math.round(growth_pct * 10) / 10
        
        if(growth_pct > 0){
            $("#r1wk_growth_pct_field").css('color', '#32CD32');
            $("#r1wk_growth_pct_field").html('+'+growth_pct+'<h5 style = "font-size: large; display:inline;">%</h5>');
            $("#r1wk_growth_field").text('+'+growth_var+' KCal');
        }
        else {
            $("#r1wk_growth_pct_field").css('color', '#FF6347');
            $("#r1wk_growth_pct_field").html(growth_pct+'<h5 style = "font-size: large; display:inline;">%</h5>');
            $("#r1wk_growth_field").text(growth_var+' KCal');
        }
        
        
        

        var chart = Chart.getChart('daily_tracker');
        if (chart) {
            chart.destroy();
            console.log('hhh');
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
                        label: 'Protein (g)',
                        data: protein_week_values,
                        backgroundColor: 'rgb(107, 174, 214, 0.7)',
                        borderColor: 'rgb(107, 174, 214, 1)',
                        borderWidth: 0.3,
                        type: 'bar',
                        stack: 'stack1'
                    },
                    {
                        label: 'Carbs (g)',
                        data: carbs_week_values,
                        backgroundColor: 'rgb(120, 197, 156,0.7)',
                        borderColor: 'rgb(120, 197, 156,1)',
                        borderWidth: 0.3,
                        type: 'bar',
                        stack: 'stack1'
                    },
                    {
                        label: 'Fats (g)',
                        data: fats_week_values,
                        backgroundColor: 'rgb(125, 125, 125, 0.7)',
                        borderColor: 'rgb(125, 125, 125, 1)',
                        borderWidth: 0.3,
                        type: 'bar',
                        stack: 'stack1'
                    },
                    {
                        label: 'Daily Calorie Intake',
                        data: total_week_calories,
                        type: 'line',
                        borderColor: '#ffcf1f',
                        backgroundColor: '#ffcf1f',
                        borderWidth: 2
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
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            fontFamily: 'sans-serif',
                            fontStyle: 'bold',
                            color: 'gray'
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
        
});